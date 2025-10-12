import { Router } from "express";
import { isUserAuthenticated } from "../../infastructure/https/middlewares/auth.user.middleware";
import { communityController } from "../../infastructure/https/controller/controller.module";
import validate from "../../infastructure/https/validation/app.validate";
import { createCommentValidator, } from "./community.validator";

const router = Router();

router.route("/").get(isUserAuthenticated, communityController.getPosts);
router.route("/").post(isUserAuthenticated, communityController.createPost);
router.route("/:id").delete(isUserAuthenticated, communityController.deletePost);
router.route("/:id").put(isUserAuthenticated, communityController.updatePost);
router.route("/:id/like").post(isUserAuthenticated, communityController.toggleLike);
router.route("/:id/bookmark").post(isUserAuthenticated, communityController.toggleBookmark);
router.route("/:id/likes").get(isUserAuthenticated, communityController.getPostLikes);
router.route("/:id/comments").get(isUserAuthenticated, communityController.getPostComments);
router.route("/:id/bookmarks").get(isUserAuthenticated, communityController.getPostBookmarks);
router.route("/:id/comments").post(isUserAuthenticated, validate(createCommentValidator), communityController.createComment);



// Comment routes
router.route("/:id/comments/:commentId/like").post(isUserAuthenticated, communityController.toggleCommentLike);
router.route("/:id/comments/:commentId/bookmark").post(isUserAuthenticated, communityController.toggleCommentBookmark);
router.route("/:id/comments/:commentId/replies").post(isUserAuthenticated, validate(createCommentValidator), communityController.createCommentReply);
// router.route("/:id/comments/:commentId/likes").get(isUserAuthenticated, communityController.getPostCommentLikes);
// router.route("/:id/comments/:commentId/bookmarks").get(isUserAuthenticated, communityController.getPostCommentBookmarks);
// router.route("/:id/comments/:commentId/replies").get(isUserAuthenticated, communityController.getPostCommentReplies);




export default router;
