"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_2 = __importDefault(require("http-status"));
class CommunityController {
    communityService;
    constructor(communityService) {
        this.communityService = communityService;
    }
    createPost = async (req, res, next) => {
        try {
            console.log("here");
            const post = await this.communityService.createCommunnityPost({
                post: req.body,
                user: req.user,
            });
            res.status(http_status_1.default.CREATED).json({
                message: "Post created successfully",
                data: post,
            });
        }
        catch (error) {
            console.log(error);
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getPosts = async (req, res, next) => {
        try {
            // const { page, pageSize } = req.query;
            const posts = await this.communityService.getPosts(req.user.id, 1, 10);
            res.status(http_status_1.default.OK).json({
                message: "Posts fetched successfully",
                data: posts,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    createComment = async (req, res, next) => {
        try {
            const comment = await this.communityService.createComment(req.params.id, req.user.id, req.body);
            res.status(http_status_1.default.CREATED).json({
                message: "Comment created successfully",
                data: comment,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    deletePost = async (req, res, next) => {
        try {
            const post = await this.communityService.deletePost(req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Post deleted successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updatePost = async (req, res, next) => {
        try {
            const post = await this.communityService.updatePost({
                id: req.params.id,
                userId: req.user.id,
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
    toggleLike = async (req, res, next) => {
        try {
            const post = await this.communityService.toggleLike(req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Post liked successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    toggleBookmark = async (req, res, next) => {
        try {
            const post = await this.communityService.toggleBookmark(req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Post bookmarked successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // Comment routes
    toggleCommentLike = async (req, res, next) => {
        try {
            const comment = await this.communityService.toggleCommentLike(req.params.commentId, req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Comment liked successfully",
                data: comment,
            });
        }
        catch (error) {
            console.log(error);
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    toggleCommentBookmark = async (req, res, next) => {
        try {
            const comment = await this.communityService.toggleCommentBookmark(req.params.commentId, req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Comment bookmarked successfully",
                data: comment,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    createCommentReply = async (req, res, next) => {
        try {
            const comment = await this.communityService.createCommentReply(req.params.id, req.user.id, req.body);
            res.status(http_status_1.default.CREATED).json({
                message: "Comment reply created successfully",
                data: comment,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // Post routes
    getPostLikes = async (req, res, next) => {
        try {
            const post = await this.communityService.getPostLikes(req.params.id);
            res.status(http_status_1.default.OK).json({
                message: "Post likes fetched successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getPostComments = async (req, res, next) => {
        try {
            const post = await this.communityService.getPostComments(req.params.id, req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "Post comments fetched successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getPostBookmarks = async (req, res, next) => {
        try {
            const post = await this.communityService.getPostBookmarks(req.params.id);
            res.status(http_status_1.default.OK).json({
                message: "Post bookmarks fetched successfully",
                data: post,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
}
exports.CommunityController = CommunityController;
