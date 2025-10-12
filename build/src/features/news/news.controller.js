"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_2 = __importDefault(require("http-status"));
class NewsController {
    newsService;
    constructor(newsService) {
        this.newsService = newsService;
    }
    createNews = async (req, res, next) => {
        try {
            const post = await this.newsService.createNews({
                post: req.body,
                admin: req.admin,
            });
            res.status(http_status_1.default.CREATED).json({
                message: "Post created successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getAllNews = async (_req, res, next) => {
        try {
            // const { page, pageSize } = req.query;
            const posts = await this.newsService.getNews(1, 10);
            res.status(http_status_1.default.OK).json({
                message: "Posts fetched successfully",
                data: posts,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    deleteNews = async (req, res, next) => {
        try {
            const post = await this.newsService.deleteNews(req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Post deleted successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updateNews = async (req, res, next) => {
        try {
            const post = await this.newsService.updateNews({
                id: req.params.id,
                adminId: req.admin.id,
                post: req.body,
            });
            res.status(http_status_1.default.OK).json({
                message: "Post updated successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getNews = async (req, res, next) => {
        try {
            const post = await this.newsService.getNewsById(req.params.id);
            res.status(http_status_1.default.OK).json({
                message: "Post fetched successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
}
exports.NewsController = NewsController;
