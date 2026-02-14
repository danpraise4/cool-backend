"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityService = void 0;
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const blobstorage_service_1 = require("../../shared/services/azure/blobstorage.service");
const uuid_1 = require("uuid");
class CommunityService {
    constructor() { }
    async createCommunnityPost(cofig) {
        const _file = (0, uuid_1.v4)();
        let _uploads = [];
        console.log("here");
        if (!cofig.post.content && cofig.post.images.length == 0) {
            throw new Error("You have to specify a content or an image");
        }
        console.log(cofig.post);
        if (cofig.post.images) {
            const imagesList = cofig.post.images;
            for (const image of imagesList) {
                const upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, `${_file}-${(0, uuid_1.v4)()}`, "image/png");
                _uploads.push(upload);
            }
        }
        const post = await connect_1.default.post.create({
            data: {
                body: cofig.post.content,
                userId: cofig.user.id,
                images: _uploads.map((upload) => upload.url),
            },
        });
        return post;
    }
    async createComment(postId, userId, body) {
        const comment = await connect_1.default.comment.create({
            data: {
                postId,
                userId,
                body: body.content,
            },
        });
        return comment;
    }
    async getPosts(userId, page = 1, pageSize = 20) {
        const skip = Number((page - 1) * pageSize); // Ensure skip is a number
        const take = Number(pageSize); // Ensure take is a number
        const posts = await connect_1.default.post.findMany({
            skip,
            take,
            orderBy: { createdAt: "desc" }, // Order posts by latest
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true,
                        bookmarks: true,
                    },
                },
                likes: {
                    where: { userId },
                    select: { id: true }, // Check if user liked the post
                },
                bookmarks: {
                    where: { userId },
                    select: { id: true }, // Check if user bookmarked the post
                },
            },
        });
        const totalPosts = await connect_1.default.post.count(); // Total post count for pagination
        return {
            posts: posts.map((post) => ({
                ...post,
                isLiked: post.likes.length > 0,
                isBookmarked: post.bookmarks.length > 0,
                commentsCount: post._count.comments,
                likesCount: post._count.likes,
                bookmarkCount: post._count.bookmarks,
            })),
            meta: {
                currentPage: page,
                pageSize,
                totalPosts,
                totalPages: Math.ceil(totalPosts / pageSize),
            },
        };
    }
    async deletePost(id, userId) {
        const post = await connect_1.default.post.findFirst({
            where: { id, userId },
        });
        if (!post) {
            throw new Error("Post not found or you don't have permission to delete it");
        }
        const deletedPost = await connect_1.default.post.update({
            where: { id },
            data: {
                status: "DELETED",
            },
        });
        return deletedPost;
    }
    async updatePost(config) {
        const existingPost = await connect_1.default.post.findFirst({
            where: {
                id: config.id,
                userId: config.userId,
            },
        });
        if (!existingPost) {
            throw new Error("Post not found or you don't have permission to update it");
        }
        let images = existingPost.images;
        if (config.post.images?.length) {
            const uploadPromises = config.post.images.map(async (image) => {
                const _file = (0, uuid_1.v4)();
                const _upload = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, _file, "image/png");
                return _upload.url;
            });
            images = await Promise.all(uploadPromises);
        }
        const updatedPost = await connect_1.default.post.update({
            where: { id: config.id },
            data: {
                body: config.post.content,
                images,
            },
        });
        return updatedPost;
    }
    // Action for comment
    async createCommentReply(id, userId, body) {
        const comment = await connect_1.default.commentReply.create({
            data: {
                commentId: id,
                userId,
                content: body.content,
            },
        });
        return comment;
    }
    async toggleCommentLike(commentId, postId, userId) {
        const post = await connect_1.default.post.findFirst({
            where: { id: postId },
        });
        if (!post) {
            throw new Error("Post not found");
        }
        const existingLike = await connect_1.default.commentLike.findFirst({
            where: {
                userId: userId,
                commentId: commentId,
            },
        });
        if (existingLike) {
            // Unlike - delete the existing like
            await connect_1.default.commentLike.delete({
                where: {
                    id: existingLike.id,
                },
            });
            return false;
        }
        else {
            // Like - create new like
            await connect_1.default.commentLike.create({
                data: {
                    commentId: commentId,
                    userId: userId,
                },
            });
            return true;
        }
    }
    async toggleCommentBookmark(commentId, postId, userId) {
        const post = await connect_1.default.post.findFirst({
            where: { id: postId },
        });
        if (!post) {
            throw new Error("Post not found");
        }
        const existingBookmark = await connect_1.default.commentBookmark.findFirst({
            where: { userId: userId, commentId: commentId },
        });
        if (existingBookmark) {
            // Remove bookmark
            await connect_1.default.commentBookmark.delete({
                where: {
                    id: existingBookmark.id,
                },
            });
            return false;
        }
        else {
            // Add bookmark
            await connect_1.default.commentBookmark.create({
                data: {
                    commentId: commentId,
                    userId: userId,
                },
            });
            return true;
        }
    }
    // Action for post
    async toggleLike(id, userId) {
        const post = await connect_1.default.post.findFirst({
            where: { id },
        });
        if (!post) {
            throw new Error("Post not found");
        }
        const existingLike = await connect_1.default.like.findUnique({
            where: {
                postId_userId: {
                    postId: id,
                    userId: userId,
                },
            },
        });
        if (existingLike) {
            // Unlike - delete the existing like
            await connect_1.default.like.delete({
                where: {
                    id: existingLike.id,
                },
            });
            return false;
        }
        else {
            // Like - create new like
            await connect_1.default.like.create({
                data: {
                    postId: id,
                    userId: userId,
                },
            });
            return true;
        }
    }
    async toggleBookmark(id, userId) {
        const post = await connect_1.default.post.findFirst({
            where: { id },
        });
        if (!post) {
            throw new Error("Post not found");
        }
        const existingBookmark = await connect_1.default.bookmark.findUnique({
            where: { postId_userId: { postId: id, userId: userId } },
        });
        if (existingBookmark) {
            // Remove bookmark
            await connect_1.default.bookmark.delete({
                where: {
                    id: existingBookmark.id,
                },
            });
            return false;
        }
        else {
            // Add bookmark
            await connect_1.default.bookmark.create({
                data: {
                    postId: id,
                    userId: userId,
                },
            });
            return true;
        }
    }
    async getPostLikes(id) {
        const likes = await connect_1.default.like.findMany({
            where: { postId: id },
        });
        return likes;
    }
    async getPostComments(id, userId) {
        const comments = await connect_1.default.comment.findMany({
            where: { postId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        image: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        bookmarks: true,
                        replies: true,
                    },
                },
                likes: {
                    where: { userId },
                    select: { id: true }, // Check if user liked the post
                },
                bookmarks: {
                    where: { userId },
                    select: { id: true }, // Check if user bookmarked the post
                },
                replies: {
                    where: { userId },
                    select: { id: true }, // Check if user replied to the comment
                },
            }
        });
        return comments.map((comment) => ({
            ...comment,
            isLiked: comment.likes.length > 0,
            isBookmarked: comment.bookmarks.length > 0,
            repliesCount: comment._count.replies,
            likesCount: comment._count.likes,
            bookmarkCount: comment._count.bookmarks,
        }));
    }
    async getPostBookmarks(id) {
        const bookmarks = await connect_1.default.bookmark.findMany({
            where: { postId: id },
        });
        return bookmarks;
    }
}
exports.CommunityService = CommunityService;
