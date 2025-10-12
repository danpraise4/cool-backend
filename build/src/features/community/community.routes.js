"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_user_middleware_1 = require("../../infastructure/https/middlewares/auth.user.middleware");
const controller_module_1 = require("../../infastructure/https/controller/controller.module");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const community_validator_1 = require("./community.validator");
const router = (0, express_1.Router)();
router.route("/").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.getPosts);
router.route("/").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.createPost);
router.route("/:id").delete(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.deletePost);
router.route("/:id").put(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.updatePost);
router.route("/:id/like").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.toggleLike);
router.route("/:id/bookmark").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.toggleBookmark);
router.route("/:id/likes").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.getPostLikes);
router.route("/:id/comments").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.getPostComments);
router.route("/:id/bookmarks").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.getPostBookmarks);
router.route("/:id/comments").post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(community_validator_1.createCommentValidator), controller_module_1.communityController.createComment);
// Comment routes
router.route("/:id/comments/:commentId/like").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.toggleCommentLike);
router.route("/:id/comments/:commentId/bookmark").post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.communityController.toggleCommentBookmark);
router.route("/:id/comments/:commentId/replies").post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(community_validator_1.createCommentValidator), controller_module_1.communityController.createCommentReply);
// router.route("/:id/comments/:commentId/likes").get(isUserAuthenticated, communityController.getPostCommentLikes);
// router.route("/:id/comments/:commentId/bookmarks").get(isUserAuthenticated, communityController.getPostCommentBookmarks);
// router.route("/:id/comments/:commentId/replies").get(isUserAuthenticated, communityController.getPostCommentReplies);
exports.default = router;
