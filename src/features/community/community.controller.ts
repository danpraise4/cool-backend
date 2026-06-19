import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { CommunityService } from "./community.services";
import { ICommunityCreatePost } from "./community.intercase";

export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  public createPost = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.createCommunnityPost({
        post: req.body as ICommunityCreatePost,
        user: req.user,
      });
      res.status(StatusCodes.CREATED).json({ message: "Post created successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public getPosts = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 10;
      const posts = await this.communityService.getPosts(req.user.id, page, pageSize);
      res.status(StatusCodes.OK).json({ message: "Posts fetched successfully", data: posts });
    } catch (error) {
      next(error);
    }
  };

  public getBookmarkedPosts = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
      const data = await this.communityService.getBookmarkedPosts(
        req.user.id,
        page,
        pageSize
      );
      res.status(StatusCodes.OK).json({
        message: "Bookmarks fetched",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public createComment = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const comment = await this.communityService.createComment(req.params.id, req.user.id, req.body);
      res.status(StatusCodes.CREATED).json({ message: "Comment created successfully", data: comment });
    } catch (error) {
      next(error);
    }
  };

  public deletePost = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.deletePost(req.params.id, req.user.id);
      res.status(StatusCodes.OK).json({ message: "Post deleted successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public updatePost = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.updatePost({
        id: req.params.id,
        userId: req.user.id,
        post: req.body,
      });
      res.status(StatusCodes.OK).json({ message: "Post updated successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public toggleLike = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.toggleLike(req.params.id, req.user.id);
      res.status(StatusCodes.OK).json({ message: "Post liked successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public toggleBookmark = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.toggleBookmark(req.params.id, req.user.id);
      res.status(StatusCodes.OK).json({ message: "Post bookmarked successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public toggleCommentLike = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const comment = await this.communityService.toggleCommentLike(req.params.commentId, req.params.id, req.user.id);
      res.status(StatusCodes.OK).json({ message: "Comment liked successfully", data: comment });
    } catch (error) {
      next(error);
    }
  };

  public toggleCommentBookmark = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const comment = await this.communityService.toggleCommentBookmark(req.params.commentId, req.params.id, req.user.id);
      res.status(StatusCodes.OK).json({ message: "Comment bookmarked successfully", data: comment });
    } catch (error) {
      next(error);
    }
  };

  public createCommentReply = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const comment = await this.communityService.createCommentReply(req.params.id, req.user.id, req.body);
      res.status(StatusCodes.CREATED).json({ message: "Comment reply created successfully", data: comment });
    } catch (error) {
      next(error);
    }
  };

  public getPostLikes = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.getPostLikes(req.params.id);
      res.status(StatusCodes.OK).json({ message: "Post likes fetched successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public getPostComments = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.getPostComments(req.params.id, req.user.id);
      res.status(StatusCodes.OK).json({ message: "Post comments fetched successfully", data: post });
    } catch (error) {
      next(error);
    }
  };

  public getPostBookmarks = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const post = await this.communityService.getPostBookmarks(req.params.id);
      res.status(StatusCodes.OK).json({ message: "Post bookmarks fetched successfully", data: post });
    } catch (error) {
      next(error);
    }
  };
}
