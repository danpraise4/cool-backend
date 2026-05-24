"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const blobstorage_service_1 = require("../../shared/services/azure/blobstorage.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
class NewsService {
    async createNews(config) {
        const uploads = [];
        if (config.post.image?.length) {
            for (const image of config.post.image) {
                const upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${(0, uuid_1.v4)()}-${uploads.length}`, "image/png");
                uploads.push(upload);
            }
        }
        return connect_1.default.news.create({
            data: {
                title: config.post.title,
                body: config.post.body,
                adminId: config.admin.id,
                media: uploads.map((u) => ({ url: u.url, name: u.blobName })),
            },
        });
    }
    async getNews(page = 1, pageSize = 20) {
        const skip = (page - 1) * pageSize;
        const where = { status: { not: client_1.Status.DELETED } };
        const [posts, totalPosts] = await Promise.all([
            connect_1.default.news.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
            }),
            connect_1.default.news.count({ where }),
        ]);
        return {
            news: posts,
            meta: {
                currentPage: page,
                pageSize,
                totalPosts,
                totalPages: Math.ceil(totalPosts / pageSize),
            },
        };
    }
    async deleteNews(id, adminId) {
        const post = await connect_1.default.news.findFirst({ where: { id, adminId } });
        if (!post) {
            throw new app_exception_1.default("News not found or you don't have permission", http_status_1.default.NOT_FOUND);
        }
        return connect_1.default.news.update({
            where: { id },
            data: { status: client_1.Status.DELETED },
        });
    }
    async updateNews(config) {
        const existing = await connect_1.default.news.findFirst({
            where: { id: config.id, adminId: config.adminId },
        });
        if (!existing) {
            throw new app_exception_1.default("News not found or you don't have permission", http_status_1.default.NOT_FOUND);
        }
        let media = existing.media;
        if (config.post.image?.length) {
            const uploads = [];
            for (const image of config.post.image) {
                const upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${(0, uuid_1.v4)()}-${uploads.length}`, "image/png");
                uploads.push(upload);
            }
            media = uploads.map((u) => ({ url: u.url, name: u.blobName }));
        }
        return connect_1.default.news.update({
            where: { id: config.id },
            data: { body: config.post.body, title: config.post.title, media },
        });
    }
    async getNewsById(id) {
        const post = await connect_1.default.news.findFirst({ where: { id } });
        if (!post) {
            throw new app_exception_1.default("News not found", http_status_1.default.NOT_FOUND);
        }
        return post;
    }
}
exports.NewsService = NewsService;
