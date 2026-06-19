import { NextFunction, Response } from "express";
import { UserService } from "./user.services";
import httpStatus from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { sendSuccess } from "../../shared/helper/response";
import pick from "../../shared/helper/pick";
import { ratingService } from "./rating.service";

export class UserController {
  constructor(private readonly userService: UserService) {}

  public submitRating = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await ratingService.submitRating({
        reviewerId: req.user.id,
        targetUserId: req.body.targetUserId,
        rating: req.body.rating,
        review: req.body.review,
        contextType: req.body.contextType,
        contextId: req.body.contextId,
      });

      res.status(httpStatus.OK).json({
        success: true,
        status: "success",
        message: "Rating submitted",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUser = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const [user, settings] = await Promise.all([
        this.userService.getUserById(req.user.id),
        this.userService.getUserSettings(req.user.id),
      ]);
      sendSuccess(res, httpStatus.OK, {
        message: "User fetched successfully",
        data: { user, settings },
      });
    } catch (error) {
      next(error);
    }
  };

  public updateDeviceToken = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updated = await this.userService.updateDeviceToken(
        req.body.deviceToken,
        req.user.id
      );
      sendSuccess(res, httpStatus.OK, {
        message: "Device token updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public uploadImage = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const updated = await this.userService.uploadImage(req.body.image, req.user.id);
      sendSuccess(res, httpStatus.OK, {
        message: "Image uploaded successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.deleteUser(req.user.id);
      sendSuccess(res, httpStatus.OK, { message: "Account deleted successfully", data: result });
    } catch (error) {
      next(error);
    }
  };

  public updateLocation = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updated = await this.userService.updateLocation(req.body.location, req.user.id);
      sendSuccess(res, httpStatus.OK, {
        message: "Location updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateSettings = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.userService.updateSettings(req.user, req.body);
      sendSuccess(res, httpStatus.OK, { message: "Settings updated successfully", data });
    } catch (error) {
      next(error);
    }
  };

  public updateUser = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const updated = await this.userService.updateUser({ ...req.body, id: req.user.id });
      sendSuccess(res, httpStatus.OK, {
        message: "User updated successfully",
        data: { user: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  public getHomeCharities = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.userService.getHomeCharities(req.user, {
        Latitude: Number(req.query.Latitude),
        Longitude: Number(req.query.Longitude),
      });
      sendSuccess(res, httpStatus.OK, { message: "Charities fetched successfully", data });
    } catch (error) {
      next(error);
    }
  };

  public getHomeHeroes = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.userService.getHomeHeroes(req.user);
      sendSuccess(res, httpStatus.OK, { message: "Heroes fetched successfully", data });
    } catch (error) {
      next(error);
    }
  };

  public getHomeTopDeals = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.userService.getHomeTopDeals(req.user, {
        Latitude: Number(req.query.Latitude),
        Longitude: Number(req.query.Longitude),
      });
      sendSuccess(res, httpStatus.OK, { message: "Top deals fetched successfully", data });
    } catch (error) {
      next(error);
    }
  };

  public getHomeFacilities = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const params = pick(req.query as Record<string, string>, ["Latitude", "Longitude"]);
      const data = await this.userService.getHomeFacilities(req.user, params);
      sendSuccess(res, httpStatus.OK, { message: "Facilities fetched successfully", data });
    } catch (error) {
      next(error);
    }
  };

  public getNotifications = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const unreadOnly = req.query.unreadOnly === "true";

      const result = await this.userService.getNotifications(req.user, {
        page,
        limit,
        unreadOnly,
      });
      sendSuccess(res, httpStatus.OK, {
        message: "Notifications fetched successfully",
        data: result.notifications,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUnreadNotificationCount = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.userService.getUnreadNotificationCount(req.user.id);
      sendSuccess(res, httpStatus.OK, {
        message: "Unread notification count fetched successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public markNotificationAsRead = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notification = await this.userService.markNotificationAsRead(
        req.user,
        req.params.id
      );
      sendSuccess(res, httpStatus.OK, {
        message: "Notification marked as read",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  public markNotificationAsUnread = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notification = await this.userService.markNotificationAsUnread(
        req.user,
        req.params.id
      );
      sendSuccess(res, httpStatus.OK, {
        message: "Notification marked as unread",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllNotificationsAsRead = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.userService.markAllNotificationsAsRead(req.user.id);
      sendSuccess(res, httpStatus.OK, {
        message: "All notifications marked as read",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteNotification = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const notification = await this.userService.deleteNotification(
        req.user,
        req.params.id
      );
      sendSuccess(res, httpStatus.OK, {
        message: "Notification deleted successfully",
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };
}
