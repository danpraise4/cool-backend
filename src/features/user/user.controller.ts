import { NextFunction, Response } from "express";
import { UserService } from "./user.services";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import pick from "../../shared/helper/pick";

export class UserController {
  constructor(private readonly userService: UserService) { }

  public getUser = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await this.userService.getUserById(req.user.id);
      const settings = await this.userService.getUserSettings(req.user.id);

      res.status(StatusCodes.OK).json({
        message: "User fetched successfully",
        data: { user, settings },
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };


  public updateDeviceToken = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const deviceToken = req.body.deviceToken;
      const userId = req.user.id;
      const updatedUser = await this.userService.updateDeviceToken(deviceToken, userId);

      res.status(StatusCodes.OK).json({
        message: "Device token updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public uploadImage = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const image = req.body.image;
      const userId = req.user.id;
      const updatedUser = await this.userService.uploadImage(image, userId);

      res.status(StatusCodes.OK).json({
        message: "Image uploaded successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public deleteUser = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user.id;
      const deletedUser = await this.userService.deleteUser(userId);
      res.status(StatusCodes.OK).json({
        message: "User deleted successfully",
        data: deletedUser,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public updateLocation = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const location = req.body.location;
      const userId = req.user.id;
      const updatedUser = await this.userService.updateLocation(location, userId);
      res.status(StatusCodes.OK).json({
        message: "Location updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public updateSettings = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user;
      const data = await this.userService.updateSettings(user, req.body);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Settings updated successfully",
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public updateUser = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updatedUser = await this.userService.updateUser({
        ...req.body,
        id: req.user.id,
      });

      res.status(StatusCodes.OK).json({
        message: "User updated successfully",
        data: { user: updatedUser },
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getHomeCharities = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {

      const homePage = await this.userService.getHomeCharities(
        req.user,
        {
          Latitude: Number(req.query.Latitude as never),
          Longitude: Number(req.query.Longitude as never),
        }
      );

      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Home page fetched successfully",
        data: homePage,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getHomeHeroes = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const homePage = await this.userService.getHomeHeroes(req.user);
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Home page fetched successfully",
        data: homePage,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getHomeTopDeals = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {

      const homePage = await this.userService.getHomeTopDeals(req.user, {
        Latitude: Number(req.query.Latitude as never),
        Longitude: Number(req.query.Longitude as never),
      });

      console.log("homePage", homePage);

      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Home page fetched successfully",
        data: homePage,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getHomeFacilities = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = pick(req.query, ["Latitude", "Longitude"]);



      const homePage = await this.userService.getHomeFacilities(
        req.user,
        params
      );
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Home page fetched successfully",
        data: homePage,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Notifications
  public getNotifications = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notifications = await this.userService.getNotifications(req.user);
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Notifications fetched successfully",
        data: notifications,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public markNotificationAsRead = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notificationId = req.params.id;
      const notifications = await this.userService.markNotificationAsRead(
        req.user,
        notificationId
      );
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Notifications marked as read successfully",
        data: notifications,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public markNotificationAsUnread = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notificationId = req.params.id;
      const notifications = await this.userService.markNotificationAsUnread(
        req.user,
        notificationId
      );
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Notifications marked as unread successfully",
        data: notifications,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
