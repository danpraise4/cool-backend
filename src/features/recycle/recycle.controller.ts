import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { RecycleService } from "./recycle.services";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";


export class RecycleController {
  constructor(private readonly recycleService: RecycleService) { }

  public createRecycleSchedule = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const schedule = await this.recycleService.createRecycleSchedule({
        schedule: req.body,
        user: req.user,
      });

      res.status(StatusCodes.CREATED).json({
        message: "Schedule created successfully",
        data: schedule,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public createRecycleScheduleReminder = async (

    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reminder = await this.recycleService.createRecycleScheduleReminder({
        userId: req.user.id,
        scheduleid: req.body.scheduleid,
      });

      res.status(StatusCodes.OK).json({
        message: "Reminder created successfully",
        status: "success",
        data: reminder,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };


  public getRecycleScheduleByTransactionId = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {

    try {
      const schedule = await this.recycleService.getRecycleScheduleByTransactionId({
        recyclerId: req.user.id,
        transactionId: req.body.id,
      });

      res.status(StatusCodes.OK).json({
        message: "Schedule fetched successfully",
        status: "success",
        data: schedule,
      });

    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };


  public updateRecycleSchedule = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {

      const schedule = await this.recycleService.updateRecycleSchedule({
        id: req.params.id,
        userId: req.user.id,
        schedule: req.body,
      });

      res.status(StatusCodes.OK).json({
        message: "Schedule updated successfully",
        status: "success",
        data: schedule,
      });


    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };





  public getRecycleSchedules = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { date } = req.query;
      const schedules = await this.recycleService.getRecycleSchedules({
        userId: req.user.id,
        date: date as string,
      });

      console.log("schedules", schedules);

      res.status(StatusCodes.OK).json({
        message: "Schedules fetched successfully",
        data: schedules,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getRecycleSchedulesById = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const schedule = await this.recycleService.getRecycleSchedule({
        id: req.params.id,
        userId: req.user.id,
      });

      res.status(StatusCodes.OK).json({
        message: "Schedule fetched successfully",
        data: schedule,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getRecycleScheduleDates = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const schedules = await this.recycleService.getRecycleScheduleDates({
        userId: req.user.id,
      });

      res.status(StatusCodes.OK).json({
        message: "Schedules fetched successfully",
        data: schedules,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // recycle chat
  public getRecycleChats = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const chats = await this.recycleService.getRecycleChats({
        userID: req.user.id,
      });

      res.status(StatusCodes.OK).json({
        message: "Chats fetched successfully",
        data: chats,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // get recycle facility data
  public getRecycleFacilityData = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const facilityData = await this.recycleService.getRecycleFacilityData({
        userID: req.user.id,
        facilityId: id,
      });

      console.log("facilityData", facilityData);

      res.status(StatusCodes.OK).json({
        message: "Facility data fetched successfully",
        status: "success",
        data: facilityData,
      });

    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public getFacilityChatById = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const chat = await this.recycleService.getRecycleChats({
        userID: req.params.id,
      });

      res.status(StatusCodes.OK).json({
        message: "Chat fetched successfully",
        status: "success",
        data: chat,
      });
    } catch (error: any) {
      console.log("error", error);
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // initiate recycle chat
  public initiateRecycleChat = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const chat = await this.recycleService.initiateRecycleChat({
        userID: req.user.id,
        withID: req.body.withID,
        type: req.body.type,
      });

      res.status(StatusCodes.OK).json({
        message: "Chat initiated successfully",
        status: "success",
        data: chat,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // initiate recycle chat

  public initiateAdminRecycleChat = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const chat = await this.recycleService.initiateRecycleChat({
        withID: req.body.withID,
        userID: req.body.userID,
        type: req.body.type,
      });

      res.status(StatusCodes.OK).json({
        message: "Chat initiated successfully",
        status: "success",
        data: chat,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // User Recycling Analytics
  public getUserRecyclingAnalytics = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    const { start, end } = req.query;

    try {
      const userAnalytics = await this.recycleService.getUserRecyclingAnalytics(
        req.user.id,
        {
          start: start ? new Date(start as string) : undefined,
          end: end ? new Date(end as string) : undefined,
        }
      );

      res.status(StatusCodes.OK).json({
        message: "User recycling analytics fetched successfully",
        data: userAnalytics,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Completed Recycle Schedules
  public getCompletedRecycleSchedules = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const completedRecycleSchedules =
        await this.recycleService.getCompletedRecycleSchedules({
          userId: req.user.id,
        });

      res.status(StatusCodes.OK).json({
        message: "Completed recycle schedules fetched successfully",
        status: "success",
        data: completedRecycleSchedules,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Top Recyclers
  public getTopRecyclers = async (
    _req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const topRecyclers = await this.recycleService.getTopRecyclers();

      res.status(StatusCodes.OK).json({
        message: "Top recyclers fetched successfully",
        status: "success",
        data: topRecyclers,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
