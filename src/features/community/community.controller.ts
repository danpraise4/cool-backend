import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { CommunityService } from "./community.services";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import { ICommunityCreatePost } from "./community.intercase";

export class CommunityController {
  constructor(private readonly communityService: CommunityService) { }

  public createPost = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log("here");
      const post = await this.communityService.createCommunnityPost({
        post: req.body as ICommunityCreatePost,
        user: req.user,
      });

      res.status(StatusCodes.CREATED).json({
        message: "Post created successfully",
        data: post,
      });
    } catch (error: any) {
      console.log(error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getPosts = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // const { page, pageSize } = req.query;
      const posts = await this.communityService.getPosts(req.user.id, 1, 10);

      res.status(StatusCodes.OK).json({
        message: "Posts fetched successfully",
        data: posts,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public createComment = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const comment = await this.communityService.createComment(
        req.params.id,
        req.user.id,
        req.body
      );

      res.status(StatusCodes.CREATED).json({
        message: "Comment created successfully",
        data: comment,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public deletePost = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.deletePost(
        req.params.id,
        req.user.id
      );

      res.status(StatusCodes.OK).json({
        message: "Post deleted successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public updatePost = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.updatePost({
        id: req.params.id,
        userId: req.user.id,
        post: req.body,
      });

      res.status(StatusCodes.OK).json({
        message: "Post updated successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public toggleLike = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.toggleLike(
        req.params.id,
        req.user.id
      );

      res.status(StatusCodes.OK).json({
        message: "Post liked successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public toggleBookmark = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.toggleBookmark(
        req.params.id,
        req.user.id
      );

      res.status(StatusCodes.OK).json({
        message: "Post bookmarked successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Comment routes

  public toggleCommentLike = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const comment = await this.communityService.toggleCommentLike(
        req.params.commentId,
        req.params.id,
        req.user.id
      );

      res.status(StatusCodes.OK).json({
        message: "Comment liked successfully",
        data: comment,
      });
    } catch (error: any) {
      console.log(error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public toggleCommentBookmark = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const comment = await this.communityService.toggleCommentBookmark(
        req.params.commentId,
        req.params.id,
        req.user.id
      );

      res.status(StatusCodes.OK).json({
        message: "Comment bookmarked successfully",
        data: comment,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public createCommentReply = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const comment = await this.communityService.createCommentReply(
        req.params.id,
        req.user.id,
        req.body
      );

      res.status(StatusCodes.CREATED).json({
        message: "Comment reply created successfully",
        data: comment,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
  // Post routes



  public getPostLikes = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.getPostLikes(req.params.id);

      res.status(StatusCodes.OK).json({
        message: "Post likes fetched successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getPostComments = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.getPostComments(req.params.id, req.user.id);

      res.status(StatusCodes.OK).json({
        message: "Post comments fetched successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getPostBookmarks = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.communityService.getPostBookmarks(req.params.id);

      res.status(StatusCodes.OK).json({
        message: "Post bookmarks fetched successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
