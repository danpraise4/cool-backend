import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";
import { AzureBlobStorageConfig, BlobResponse } from "./blobstorage.model";

export class AzureBlobService {
  private config: AzureBlobStorageConfig;
  private available = false;
  public static instance: AzureBlobService;

  public isAvailable(): boolean {
    return this.available;
  }

  constructor(config: AzureBlobStorageConfig) {
    this.config = config;
    this.initialize();
  }

  public static getInstance(
    cloudName: string,
    apiKey: string,
    apiSecret: string,
    uploadPreset?: string
  ): AzureBlobService {
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

  public initialize(): void {
    try {
      cloudinary.config({
        cloud_name: this.config.cloudName,
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        secure: true,
      });
      this.available = Boolean(
        this.config.cloudName && this.config.apiKey && this.config.apiSecret
      );
      if (this.available) {
        console.log("Cloudinary initialized successfully");
      } else {
        console.warn("Cloudinary unavailable: missing configuration");
      }
    } catch (error: any) {
      this.available = false;
      console.error(`Cloudinary initialization failed: ${error.message}`);
    }
  }

  private blobUnavailableResponse(): BlobResponse {
    return { success: false, error: "Cloudinary is unavailable" };
  }

  private validateFile(
    fileType: string,
    fileSize: number
  ): { valid: boolean; error?: string } {
    if (
      this.config.allowedFileTypes &&
      !this.config.allowedFileTypes.includes(fileType)
    ) {
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

  private generateUniqueBlobName(originalFileName: string): string {
    const extension = path.extname(originalFileName) || ".jpg";
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    return `${timestamp}-${randomId}${extension}`;
  }

  private extractPublicIdFromUrl(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      const parts = url.pathname.split("/upload/");
      if (parts.length < 2) return imageUrl;
      const raw = parts[1].replace(/^v\d+\//, "");
      return raw.replace(path.extname(raw), "");
    } catch {
      return imageUrl;
    }
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  public async uploadFile(
    file: Buffer | Readable,
    fileName: string,
    contentType: string,
    fileSize: number,
    folder?: string
  ): Promise<BlobResponse> {
    if (!this.available) return this.blobUnavailableResponse();
    const validation = this.validateFile(contentType, fileSize);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      let finalFileName = fileName;
      if (!path.extname(fileName)) {
        const extMap: { [key: string]: string } = {
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

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: path.basename(uniqueBlobName, path.extname(uniqueBlobName)),
            resource_type: "auto",
            upload_preset: this.config.uploadPreset,
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Cloudinary upload failed"));
              return;
            }
            resolve(result);
          }
        );
        uploadStream.end(fileBuffer);
      });

      return {
        success: true,
        url: uploadResult.secure_url,
        blobName: uploadResult.public_id,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  public async uploadImage(
    imageFile: Buffer | Readable,
    fileName: string,
    contentType: string,
    fileSize: number
  ): Promise<BlobResponse> {
    return this.uploadFile(imageFile, fileName, contentType, fileSize, "images");
  }

  public async uploadVideo(
    videoFile: Buffer | Readable,
    fileName: string,
    contentType: string,
    fileSize: number
  ): Promise<BlobResponse> {
    return this.uploadFile(videoFile, fileName, contentType, fileSize, "videos");
  }

  public async deleteFile(blobName: string): Promise<BlobResponse> {
    if (!this.available) return this.blobUnavailableResponse();
    try {
      const result = await cloudinary.uploader.destroy(blobName, {
        resource_type: "image",
        invalidate: true,
      });
      if (result.result !== "ok" && result.result !== "not found") {
        return { success: false, error: `Delete failed: ${result.result}` };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  public async deleteImage(imageUrl: string): Promise<void> {
    if (!this.available) {
      throw new Error("Cloudinary is unavailable");
    }
    const publicId = this.extractPublicIdFromUrl(imageUrl);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Delete failed: ${result.result}`);
    }
  }

  public async replaceFile(
    blobName: string,
    newFile: Buffer | Readable,
    contentType: string,
    fileSize: number
  ): Promise<BlobResponse> {
    if (!this.available) return this.blobUnavailableResponse();
    await this.deleteFile(blobName);
    return this.uploadFile(newFile, blobName, contentType, fileSize);
  }

  public async copyFile(
    _sourceBlobName: string,
    _destinationBlobName?: string
  ): Promise<BlobResponse> {
    return { success: false, error: "Copy operation is not supported in Cloudinary service" };
  }

  public async listFiles(
    prefix?: string
  ): Promise<{ name: string; url: string; contentType: string; size: number }[]> {
    if (!this.available) {
      throw new Error("Cloudinary is unavailable");
    }
    const resources = await cloudinary.api.resources({
      max_results: 500,
      type: "upload",
      prefix,
      resource_type: "image",
    });

    return (resources.resources || []).map((resource: any) => ({
      name: resource.public_id,
      url: resource.secure_url,
      contentType: resource.format || "unknown",
      size: resource.bytes || 0,
    }));
  }

  public async getBlobUrl(blobName: string): Promise<string | null> {
    if (!this.available) return null;
    return cloudinary.url(blobName, { secure: true });
  }

  public async generateSasUrl(blobName: string): Promise<string | null> {
    if (!this.available) return null;
    return cloudinary.url(blobName, { secure: true, sign_url: true });
  }

  public async getBlobProperties(blobName: string): Promise<any | null> {
    if (!this.available) return null;
    try {
      return await cloudinary.api.resource(blobName, { resource_type: "image" });
    } catch {
      return null;
    }
  }

  public async uploadBase64Image(
    base64String: string,
    fileName: string,
    contentType: string
  ): Promise<BlobResponse> {
    if (!this.available) return this.blobUnavailableResponse();
    try {
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      return this.uploadFile(buffer, fileName, contentType, buffer.length, "images");
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  public async validateAndProcessBase64(
    base64String: string
  ): Promise<{ valid: boolean; buffer?: Buffer; contentType?: string; error?: string }> {
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
    } catch (error: any) {
      return { valid: false, error: `Error processing base64 string: ${error.message}` };
    }
  }

  public async replaceWithBase64Image(
    blobName: string,
    base64String: string
  ): Promise<BlobResponse> {
    if (!this.available) return this.blobUnavailableResponse();
    const processed = await this.validateAndProcessBase64(base64String);
    if (!processed.valid || !processed.buffer || !processed.contentType) {
      return { success: false, error: processed.error };
    }
    return this.replaceFile(
      blobName,
      processed.buffer,
      processed.contentType,
      processed.buffer.length
    );
  }

  public async debugListBlobs(prefix?: string): Promise<void> {
    try {
      const items = await this.listFiles(prefix);
      console.log(`Found ${items.length} Cloudinary assets`);
    } catch (error: any) {
      console.error(`Error in debugListBlobs: ${error.message}`);
    }
  }

  public async debugCheckBlob(blobName: string): Promise<{
    exists: boolean;
    properties?: any;
    url?: string;
    error?: string;
  }> {
    try {
      const resource = await this.getBlobProperties(blobName);
      if (!resource) return { exists: false };
      return { exists: true, properties: resource, url: resource.secure_url };
    } catch (error: any) {
      return { exists: false, error: error.message };
    }
  }
}

export const createBlobService = (
  config: AzureBlobStorageConfig
): AzureBlobService => {
  return new AzureBlobService(config);
};
