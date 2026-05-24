"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBlobService = exports.AzureBlobService = void 0;
const cloudinary_1 = require("cloudinary");
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const logger_1 = __importDefault(require("../logger"));
class AzureBlobService {
    config;
    available = false;
    static instance;
    isAvailable() {
        return this.available;
    }
    constructor(config) {
        this.config = config;
        this.initialize();
    }
    static getInstance(cloudName, apiKey, apiSecret, uploadPreset) {
        if (!AzureBlobService.instance) {
            AzureBlobService.instance = new AzureBlobService({
                cloudName,
                apiKey,
                apiSecret,
                uploadPreset,
            });
        }
        return AzureBlobService.instance;
    }
    initialize() {
        try {
            cloudinary_1.v2.config({
                cloud_name: this.config.cloudName,
                api_key: this.config.apiKey,
                api_secret: this.config.apiSecret,
                secure: true,
            });
            this.available = Boolean(this.config.cloudName && this.config.apiKey && this.config.apiSecret);
            if (this.available) {
                logger_1.default.info("Cloudinary initialized");
            }
            else {
                logger_1.default.warn("Cloudinary unavailable: missing configuration");
            }
        }
        catch (error) {
            this.available = false;
            logger_1.default.error({ err: error }, "Cloudinary initialization failed");
        }
    }
    blobUnavailableResponse() {
        return { success: false, error: "Cloudinary is unavailable" };
    }
    validateFile(fileType, fileSize) {
        if (this.config.allowedFileTypes &&
            !this.config.allowedFileTypes.includes(fileType)) {
            return {
                valid: false,
                error: `Invalid file type. Allowed types: ${this.config.allowedFileTypes.join(", ")}`,
            };
        }
        if (this.config.maxSizeBytes && fileSize > this.config.maxSizeBytes) {
            return {
                valid: false,
                error: `File size exceeds ${this.config.maxSizeBytes / (1024 * 1024)} MB`,
            };
        }
        return { valid: true };
    }
    generateUniqueBlobName(originalFileName) {
        const extension = path.extname(originalFileName) || ".jpg";
        const timestamp = Date.now();
        const randomId = (0, uuid_1.v4)().substring(0, 8);
        return `${timestamp}-${randomId}${extension}`;
    }
    extractPublicIdFromUrl(imageUrl) {
        try {
            const url = new URL(imageUrl);
            const parts = url.pathname.split("/upload/");
            if (parts.length < 2)
                return imageUrl;
            const raw = parts[1].replace(/^v\d+\//, "");
            return raw.replace(path.extname(raw), "");
        }
        catch {
            return imageUrl;
        }
    }
    async streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async uploadFile(file, fileName, contentType, fileSize, folder) {
        if (!this.available)
            return this.blobUnavailableResponse();
        const validation = this.validateFile(contentType, fileSize);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        try {
            let finalFileName = fileName;
            if (!path.extname(fileName)) {
                const extMap = {
                    "image/jpeg": ".jpg",
                    "image/jpg": ".jpg",
                    "image/png": ".png",
                    "image/gif": ".gif",
                    "image/webp": ".webp",
                    "video/mp4": ".mp4",
                    "video/avi": ".avi",
                    "video/mov": ".mov",
                };
                finalFileName = `${fileName}${extMap[contentType] || ".bin"}`;
            }
            const uniqueBlobName = this.generateUniqueBlobName(finalFileName);
            const fileBuffer = file instanceof Buffer ? file : await this.streamToBuffer(file);
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder,
                    public_id: path.basename(uniqueBlobName, path.extname(uniqueBlobName)),
                    resource_type: "auto",
                    upload_preset: this.config.uploadPreset,
                }, (error, result) => {
                    if (error || !result) {
                        reject(error || new Error("Cloudinary upload failed"));
                        return;
                    }
                    resolve(result);
                });
                uploadStream.end(fileBuffer);
            });
            return {
                success: true,
                url: uploadResult.secure_url,
                blobName: uploadResult.public_id,
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async uploadImage(imageFile, fileName, contentType, fileSize) {
        return this.uploadFile(imageFile, fileName, contentType, fileSize, "images");
    }
    async uploadVideo(videoFile, fileName, contentType, fileSize) {
        return this.uploadFile(videoFile, fileName, contentType, fileSize, "videos");
    }
    async deleteFile(blobName) {
        if (!this.available)
            return this.blobUnavailableResponse();
        try {
            const result = await cloudinary_1.v2.uploader.destroy(blobName, {
                resource_type: "image",
                invalidate: true,
            });
            if (result.result !== "ok" && result.result !== "not found") {
                return { success: false, error: `Delete failed: ${result.result}` };
            }
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async deleteImage(imageUrl) {
        if (!this.available) {
            throw new Error("Cloudinary is unavailable");
        }
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        const result = await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
        });
        if (result.result !== "ok" && result.result !== "not found") {
            throw new Error(`Delete failed: ${result.result}`);
        }
    }
    async replaceFile(blobName, newFile, contentType, fileSize) {
        if (!this.available)
            return this.blobUnavailableResponse();
        await this.deleteFile(blobName);
        return this.uploadFile(newFile, blobName, contentType, fileSize);
    }
    async copyFile(_sourceBlobName, _destinationBlobName) {
        return { success: false, error: "Copy operation is not supported in Cloudinary service" };
    }
    async listFiles(prefix) {
        if (!this.available) {
            throw new Error("Cloudinary is unavailable");
        }
        const resources = await cloudinary_1.v2.api.resources({
            max_results: 500,
            type: "upload",
            prefix,
            resource_type: "image",
        });
        return (resources.resources || []).map((resource) => ({
            name: resource.public_id,
            url: resource.secure_url,
            contentType: resource.format || "unknown",
            size: resource.bytes || 0,
        }));
    }
    async getBlobUrl(blobName) {
        if (!this.available)
            return null;
        return cloudinary_1.v2.url(blobName, { secure: true });
    }
    async generateSasUrl(blobName) {
        if (!this.available)
            return null;
        return cloudinary_1.v2.url(blobName, { secure: true, sign_url: true });
    }
    async getBlobProperties(blobName) {
        if (!this.available)
            return null;
        try {
            return await cloudinary_1.v2.api.resource(blobName, { resource_type: "image" });
        }
        catch {
            return null;
        }
    }
    async uploadBase64Image(base64String, fileName, contentType) {
        if (!this.available)
            return this.blobUnavailableResponse();
        try {
            const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            return this.uploadFile(buffer, fileName, contentType, buffer.length, "images");
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    async validateAndProcessBase64(base64String) {
        if (!this.available) {
            return { valid: false, error: "Cloudinary is unavailable" };
        }
        try {
            if (!base64String.match(/^data:image\/[a-zA-Z]+;base64,/)) {
                return {
                    valid: false,
                    error: "Invalid base64 string format. Must start with data:image/*;base64,",
                };
            }
            const contentType = base64String.split(";")[0].split(":")[1];
            const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
            const buffer = Buffer.from(base64Data, "base64");
            const validation = this.validateFile(contentType, buffer.length);
            if (!validation.valid) {
                return { valid: false, error: validation.error };
            }
            return { valid: true, buffer, contentType };
        }
        catch (error) {
            return { valid: false, error: `Error processing base64 string: ${error.message}` };
        }
    }
    async replaceWithBase64Image(blobName, base64String) {
        if (!this.available)
            return this.blobUnavailableResponse();
        const processed = await this.validateAndProcessBase64(base64String);
        if (!processed.valid || !processed.buffer || !processed.contentType) {
            return { success: false, error: processed.error };
        }
        return this.replaceFile(blobName, processed.buffer, processed.contentType, processed.buffer.length);
    }
}
exports.AzureBlobService = AzureBlobService;
const createBlobService = (config) => {
    return new AzureBlobService(config);
};
exports.createBlobService = createBlobService;
