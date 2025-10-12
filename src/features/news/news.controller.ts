import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { NewsService } from "./news.services";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";

export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  public createNews = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.newsService.createNews({
        post: req.body,
        admin: req.admin,
      });

      res.status(StatusCodes.CREATED).json({
        message: "Post created successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getAllNews = async (
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // const { page, pageSize } = req.query;
      const posts = await this.newsService.getNews(1, 10);

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

  public deleteNews = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.newsService.deleteNews(
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

  public updateNews = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.newsService.updateNews({
        id: req.params.id,
        adminId: req.admin.id,
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

  public getNews = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const post = await this.newsService.getNewsById(req.params.id);

      res.status(StatusCodes.OK).json({
        message: "Post fetched successfully",
        data: post,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
