"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const blobstorage_service_1 = require("../../shared/services/azure/blobstorage.service");
const uuid_1 = require("uuid");
class NewsService {
    constructor() { }
    async createNews(cofig) {
        const _file = (0, uuid_1.v4)();
        let _uploads = [];
        if (cofig.post.image && cofig.post.image.length > 0) {
            // Upload each image and collect responses
            for (const image of cofig.post.image) {
                const _upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${_file}-${_uploads.length}`, "image/png");
                _uploads.push(_upload);
            }
        }
        const post = await connect_1.default.news.create({
            data: {
                title: cofig.post.title,
                body: cofig.post.body,
                adminId: cofig.admin.id,
                media: _uploads.length > 0
                    ? _uploads.map((upload) => ({
                        url: upload.url,
                        name: upload.blobName,
                    }))
                    : [],
            },
        });
        return post;
    }
    async getNews(page = 1, pageSize = 20) {
        const skip = Number((page - 1) * pageSize); // Ensure skip is a number
        const take = Number(pageSize); // Ensure take is a number
        const posts = await connect_1.default.news.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" }, // Order posts by latest
        });
        const totalPosts = await connect_1.default.news.count(); // Total post count for pagination
        return {
            news: posts.map((post) => ({
                ...post,
            })),
            meta: {
                currentPage: page,
                pageSize,
                totalPosts,
                totalPages: Math.ceil(totalPosts / pageSize),
            },
        };
    }
    async deleteNews(id, adminId) {
        const post = await connect_1.default.news.findFirst({
            where: { id, adminId },
        });
        if (!post) {
            throw new Error("Post not found or you don't have permission to delete it");
        }
        const deletedPost = await connect_1.default.news.update({
            where: { id },
            data: {
                status: "DELETED",
            },
        });
        return deletedPost;
    }
    async updateNews(config) {
        const existingPost = await connect_1.default.news.findFirst({
            where: {
                id: config.id,
                adminId: config.adminId,
            },
        });
        if (!existingPost) {
            throw new Error("Post not found or you don't have permission to update it");
        }
        let media = existingPost.media;
        if (config.post.image && config.post.image.length > 0) {
            const _file = (0, uuid_1.v4)();
            let _uploads = [];
            // Upload each image and collect responses
            for (const image of config.post.image) {
                const _upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${_file}-${_uploads.length}`, "image/png");
                _uploads.push(_upload);
            }
            media = _uploads.map((upload) => ({
                url: upload.url,
                name: upload.blobName,
            }));
        }
        const updatedPost = await connect_1.default.news.update({
            where: { id: config.id },
            data: {
                body: config.post.body,
                media,
            },
        });
        return updatedPost;
    }
    async getNewsById(id) {
        const post = await connect_1.default.news.findFirst({
            where: { id },
        });
        if (!post) {
            throw new Error("Post not found");
        }
        return post;
    }
}
exports.NewsService = NewsService;
