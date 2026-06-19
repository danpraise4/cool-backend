import { NextFunction, Response } from "express";
import StatusCodes from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { RecycleService } from "./recycle.services";
import { resolveRecycleTargetUserId } from "./recycle.public.utils";

export class RecycleController {
  constructor(private readonly recycleService: RecycleService) {}

  public createRecycleSchedule = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const schedule = await this.recycleService.createRecycleSchedule({
        schedule: req.body,
        user: req.user,
      });
      res.status(StatusCodes.CREATED).json({ message: "Schedule created successfully", data: schedule });
    } catch (error) {
      next(error);
    }
  };

  public createRecycleScheduleReminder = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const reminder = await this.recycleService.createRecycleScheduleReminder({
        userId: req.user.id,
        scheduleid: req.body.scheduleid,
      });
      res.status(StatusCodes.OK).json({ message: "Reminder created successfully", status: "success", data: reminder });
    } catch (error) {
      next(error);
    }
  };

  public getRecycleScheduleByTransactionId = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const schedule = await this.recycleService.getRecycleScheduleByTransactionId({
        recyclerId: req.user.id,
        transactionId: req.body.id,
      });
      res.status(StatusCodes.OK).json({ message: "Schedule fetched successfully", status: "success", data: schedule });
    } catch (error) {
      next(error);
    }
  };

  public updateRecycleSchedule = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const schedule = await this.recycleService.updateRecycleSchedule({
        id: req.params.id,
        userId: req.user.id,
        schedule: req.body,
      });
      res.status(StatusCodes.OK).json({ message: "Schedule updated successfully", status: "success", data: schedule });
    } catch (error) {
      next(error);
    }
  };

  public getRecycleSchedules = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const schedules = await this.recycleService.getRecycleSchedules({
        userId: req.user.id,
        date: req.query.date as string,
      });
      res.status(StatusCodes.OK).json({ message: "Schedules fetched successfully", data: schedules });
    } catch (error) {
      next(error);
    }
  };

  public getRecycleSchedulesById = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const schedule = await this.recycleService.getRecycleSchedule({
        id: req.params.id,
        userId: req.user.id,
      });
      res.status(StatusCodes.OK).json({ message: "Schedule fetched successfully", data: schedule });
    } catch (error) {
      next(error);
    }
  };

  public getRecycleScheduleDates = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const schedules = await this.recycleService.getRecycleScheduleDates({ userId: req.user.id });
      res.status(StatusCodes.OK).json({ message: "Schedules fetched successfully", data: schedules });
    } catch (error) {
      next(error);
    }
  };

  public getRecycleChats = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const chats = await this.recycleService.getRecycleChats({ userID: req.user.id });
      res.status(StatusCodes.OK).json({ message: "Chats fetched successfully", data: chats });
    } catch (error) {
      next(error);
    }
  };

  public getRecycleFacilityData = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const facilityData = await this.recycleService.getRecycleFacilityData({
        userID: req.user.id,
        facilityId: req.params.id,
      });
      res.status(StatusCodes.OK).json({ message: "Facility data fetched successfully", status: "success", data: facilityData });
    } catch (error) {
      next(error);
    }
  };

  public getFacilityChatById = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const chat = await this.recycleService.getRecycleChats({ userID: req.params.id });
      res.status(StatusCodes.OK).json({ message: "Chat fetched successfully", status: "success", data: chat });
    } catch (error) {
      next(error);
    }
  };

  public initiateRecycleChat = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const chat = await this.recycleService.initiateRecycleChat({
        userID: req.user.id,
        withID: req.body.withID,
        type: req.body.type,
      });
      res.status(StatusCodes.OK).json({ message: "Chat initiated successfully", status: "success", data: chat });
    } catch (error) {
      next(error);
    }
  };

  public initiateAdminRecycleChat = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const chat = await this.recycleService.initiateRecycleChat({
        withID: req.body.withID,
        userID: req.body.userID,
        type: req.body.type,
      });
      res.status(StatusCodes.OK).json({ message: "Chat initiated successfully", status: "success", data: chat });
    } catch (error) {
      next(error);
    }
  };

  public getUserRecyclingAnalytics = async (req: RequestType, res: Response, next: NextFunction) => {
    const { start, end, year } = req.query;
    try {
      const targetUserId = await resolveRecycleTargetUserId(req);

      let timeRange: { start?: Date; end?: Date } | undefined;
      if (year) {
        const yearNum = Number(year);
        if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            message: "Invalid year parameter",
          });
          return;
        }
        timeRange = {
          start: new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0, 0)),
          end: new Date(Date.UTC(yearNum, 11, 31, 23, 59, 59, 999)),
        };
      } else if (start || end) {
        timeRange = {
          start: start ? new Date(start as string) : undefined,
          end: end ? new Date(end as string) : undefined,
        };
      }

      const userAnalytics = await this.recycleService.getUserRecyclingAnalytics(
        targetUserId,
        timeRange
      );
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "User recycling analytics fetched successfully",
        data: userAnalytics,
      });
    } catch (error) {
      next(error);
    }
  };

  public getCompletedRecycleSchedules = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      const targetUserId = await resolveRecycleTargetUserId(req);
      const completedRecycleSchedules =
        await this.recycleService.getCompletedRecycleSchedules({ userId: targetUserId });
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Completed recycle schedules fetched successfully",
        data: completedRecycleSchedules,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTopRecyclers = async (_req: RequestType, res: Response, next: NextFunction) => {
    try {
      const topRecyclers = await this.recycleService.getTopRecyclers();
      res.status(StatusCodes.OK).json({ message: "Top recyclers fetched successfully", status: "success", data: topRecyclers });
    } catch (error) {
      next(error);
    }
  };
}

