import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { Helper } from "../../shared/helper/helper";
import AdminServiceClient from "../../shared/services/admin/adminservice.client";
import AdminService from "../../shared/services/admin/adminservice";
import { IMaterialData } from "../../shared/services/admin/adminservice.interface";
import { ICommunityCreateSchedule, IRecycleScheduleUser, IUpdateRecycleSchedule } from "./recycle.intefase";
import { RecycleChatType, RecycleScheduleStatus } from "@prisma/client";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import { getCountryForCity } from "../../shared/config/region";
import {
  emailNotificationService,
  EmailNotificationType,
} from "../../shared/services/email/email-notification.service";
import { notificationService } from "../../shared/services/notification/notification.service";
import { mapPublicFacility, mapPublicMaterial, buildUserRecyclingAnalyticsRows, mapCompletedScheduleRow, filterAnalyticsRowsForMobile } from "./recycle.public.utils";

export class RecycleService {
  private readonly adminClient: AdminService;

  constructor() {
    this.adminClient = new AdminServiceClient(new AdminService()).build();
  }

  public async createRecycleSchedule(config: {
    user: IRecycleScheduleUser;
    schedule: ICommunityCreateSchedule;
  }) {
    const { type, facilityId, materialId, dates } = config.schedule;
    const { id: userId, firstName, lastName, email, phone, address } = config.user;

    const [facility, material] = await Promise.all([
      this.adminClient.getFacilityById(facilityId),
      this.adminClient.getMaterialById(materialId),
    ]);

    if (!facility) {
      throw new AppException("Facility not found", httpStatus.NOT_FOUND);
    }

    if (!material) {
      throw new AppException("Material not found", httpStatus.NOT_FOUND);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allFuture = dates.every((date) => {
      const d = Helper.toDate(date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    });

    if (!allFuture) {
      throw new AppException(
        "All dates must be today or in the future",
        httpStatus.BAD_REQUEST
      );
    }

    const adminRequest = await this.adminClient.createRecycleRequest({
      facilityId: facility.payload.id,
      recycler: {
        recyclerAppId: userId,
        fullName: `${firstName} ${lastName}`,
        email,
        phoneNumber: phone,
        address: {
          lineOne: address,
          lineTwo: null,
          lineThree: null,
          postCode: "",
          state: config.user.cityOfResidence,
          city: config.user.cityOfResidence,
          country: getCountryForCity(config.user.cityOfResidence),
        },
      },
      recycle: {
        collectionMethod: type === "PICKUP" ? 1 : 2,
        materialId: material.payload.id,
        quantity: config.schedule.quantity || 0,
        scheduledCollectionDate: Helper.toDate(dates[0]).toISOString(),
      },
    });

    const schedule = await prismaClient.recycleSchedule.create({
      data: {
        type,
        transactionId: adminRequest.payload.transactionId,
        facility: facility.payload.id.toString(),
        material: material.payload.id.toString(),
        dates: dates.map((d) => Helper.toDate(d)),
        quantity: config.schedule.quantity || 0,
        userId,
      },
    });

    emailNotificationService.notifyUser(userId, EmailNotificationType.RECYCLE_REQUEST_SUBMITTED, {
      firstName,
      facilityName: facility.payload.name,
      materialName: material.payload.category,
      scheduledDate: Helper.toDate(dates[0]).toLocaleDateString("en-GB"),
    });

    void notificationService.createAndSend(userId, {
      title: "Recycle request submitted",
      body: `Your recycle request to ${facility.payload.name} for ${material.payload.category} was submitted.`,
      link: "/recycle",
      type: "RECYCLE_REQUEST_SUBMITTED",
      data: {
        type: "RECYCLE_REQUEST_SUBMITTED",
        scheduleId: schedule.id,
      },
    });

    return schedule;
  }

  public async updateRecycleSchedule(config: {
    id: string;
    userId: string;
    schedule: IUpdateRecycleSchedule;
  }) {
    const existingSchedule = await prismaClient.recycleSchedule.findFirst({
      where: { id: config.id, userId: config.userId },
    });

    if (!existingSchedule) {
      throw new AppException(
        "Schedule not found or you don't have permission to update it",
        httpStatus.NOT_FOUND
      );
    }

    if (!existingSchedule.transactionId) {
      throw new AppException(
        "This schedule cannot be updated because it has no linked facility request",
        httpStatus.BAD_REQUEST
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = Helper.toDate(config.schedule.scheduledCollectionDate);
    scheduledDate.setHours(0, 0, 0, 0);

    if (scheduledDate < today) {
      throw new AppException(
        "Scheduled date must be today or in the future",
        httpStatus.BAD_REQUEST
      );
    }

    await this.adminClient.updateRecycleRequest(existingSchedule.transactionId, {
      recyclerAppId: config.userId,
      transactionStatus: config.schedule.transactionStatus,
      scheduledCollectionDate: scheduledDate.toISOString(),
      quantity: config.schedule.quantity || 0,
    });

    const updatedSchedule = await prismaClient.recycleSchedule.update({
      where: { id: config.id },
      data: {
        dates: [scheduledDate],
        status: Helper.matchStatus(
          config.schedule.transactionStatus
        ) as RecycleScheduleStatus,
        quantity: config.schedule.quantity ?? existingSchedule.quantity ?? 1,
      },
    });

    const newStatus = updatedSchedule.status;
    if (newStatus === RecycleScheduleStatus.COMPLETED) {
      void notificationService.createAndSend(config.userId, {
        title: "Recycle completed",
        body: "Your recycling schedule was marked as completed.",
        link: "/recycle",
        type: "RECYCLE_COMPLETED",
        data: {
          type: "RECYCLE_COMPLETED",
          scheduleId: config.id,
        },
      });
    } else if (newStatus === RecycleScheduleStatus.CANCELLED) {
      void notificationService.createAndSend(config.userId, {
        title: "Recycle cancelled",
        body: "Your recycling schedule was cancelled.",
        link: "/recycle",
        type: "RECYCLE_CANCELLED",
        data: {
          type: "RECYCLE_CANCELLED",
          scheduleId: config.id,
        },
      });
    }

    return updatedSchedule;
  }

  public async getRecycleScheduleByTransactionId(config: {
    recyclerId: string;
    transactionId: string;
  }) {
    const schedule = await prismaClient.recycleSchedule.findFirst({
      where: { id: config.transactionId },
    });

    if (!schedule) {
      throw new AppException("Schedule not found", httpStatus.NOT_FOUND);
    }

    const [facility, material] = await Promise.all([
      this.adminClient.getFacilityById(schedule.facility),
      this.adminClient.getMaterialById(schedule.material),
    ]);

    const recycleRequest = await this.adminClient.getRecycleRequestById({
      recyclerId: config.recyclerId.trim(),
      transactionId: schedule.transactionId.toString().trim(),
    });

    return {
      schedule,
      facility: facility.payload,
      material: material.payload,
      recycleRequest: recycleRequest.payload,
    };
  }

  public async createRecycleScheduleReminder(config: {
    userId: string;
    scheduleid: string;
    remindAt?: Date;
  }) {
    const findSchedule = await prismaClient.recycleSchedule.findUnique({
      where: { id: config.scheduleid },
      include: { reminders: true },
    });

    if (!findSchedule) {
      throw new AppException("Schedule not found", httpStatus.NOT_FOUND);
    }

    if (findSchedule.reminders.length > 0) {
      throw new AppException("Reminder already exists", httpStatus.CONFLICT);
    }

    const scheduleDate = findSchedule.dates[0];
    if (!scheduleDate) {
      throw new AppException("No scheduled date found", httpStatus.BAD_REQUEST);
    }

    const dayBefore = new Date(scheduleDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(15, 0, 0, 0);

    const sameDay = new Date(scheduleDate);
    sameDay.setHours(7, 0, 0, 0);

    return Promise.all([
      prismaClient.recycleReminder.create({
        data: { userId: config.userId, scheduleId: config.scheduleid, remindAt: dayBefore },
      }),
      prismaClient.recycleReminder.create({
        data: { userId: config.userId, scheduleId: config.scheduleid, remindAt: sameDay },
      }),
    ]);
  }

  public async deleteRecycleSchedule(config: { id: string; userId: string }) {
    return prismaClient.recycleSchedule.delete({
      where: { id: config.id, userId: config.userId },
    });
  }

  public async getRecycleSchedule(config: { id: string; userId: string }) {
    const schedule = await prismaClient.recycleSchedule.findFirst({
      where: { id: config.id, userId: config.userId },
      include: { reminders: true },
    });

    if (!schedule) {
      throw new AppException("Schedule not found", httpStatus.NOT_FOUND);
    }

    return schedule;
  }

  public async getRecycleSchedules(config: { userId: string; date: string }) {
    const date = Helper.toDate(config.date);

    const schedules = await prismaClient.recycleSchedule.findMany({
      where: { userId: config.userId, dates: { has: date } },
      include: { reminders: true },
    });

    return Promise.all(
      schedules.map(async (schedule) => {
        const [facility, material] = await Promise.all([
          this.adminClient.getFacilityById(schedule.facility),
          this.adminClient.getMaterialById(schedule.material),
        ]);
        return { ...schedule, facility: facility.payload, material: material.payload };
      })
    );
  }

  public async getRecycleScheduleDates(config: { userId: string }) {
    const schedules = await prismaClient.recycleSchedule.findMany({
      where: { userId: config.userId },
      select: { dates: true },
    });

    return schedules.flatMap((s) => s.dates);
  }

  public async initiateRecycleChat(config: {
    userID: string;
    withID: string;
    type: RecycleChatType;
  }) {
    const { userID, withID, type } = config;
    const chatID = Helper.generateChatID(userID, withID);

    const existing = await prismaClient.recycleChat.findFirst({
      where: { chatID, OR: [{ createdBy: userID }, { withUser: userID }] },
    });

    if (existing) return existing;

    const user = await prismaClient.user.findUnique({ where: { id: userID } });

    if (!user) {
      throw new AppException("User not found", httpStatus.NOT_FOUND);
    }

    return prismaClient.recycleChat.create({
      data: {
        chatID,
        createdBy: userID,
        withUser: withID,
        name: `${user.firstName} ${user.lastName}`,
        profilePhoto: user.image,
        type,
      },
    });
  }

  public async sendRecycleChatMessage(config: {
    chatID: string;
    message: string;
    userID: string;
  }) {
    const { chatID, message, userID } = config;

    const chat = await prismaClient.recycleChat.findUnique({ where: { id: chatID } });

    if (!chat) {
      throw new AppException("Chat not found", httpStatus.NOT_FOUND);
    }

    const newMessage = await prismaClient.recycleChatMessage.create({
      data: { message, senderID: userID, recycleChatId: chatID },
    });

    await prismaClient.recycleChat.update({
      where: { id: chat.id },
      data: { lastMessage: { connect: { id: newMessage.id } } },
    });

    return newMessage;
  }

  public async getRecycleChatMessages(config: { chatID: string }) {
    return prismaClient.recycleChatMessage.findMany({
      where: { recycleChatId: config.chatID },
    });
  }

  public async getRecycleChats(config: { userID: string }) {
    return prismaClient.recycleChat.findMany({
      where: {
        OR: [{ createdBy: config.userID }, { withUser: config.userID }],
      },
      include: { lastMessage: true },
      orderBy: { lastMessage: { createdAt: "desc" } },
    });
  }

  public async getRecycleFacilityData(config: {
    userID: string;
    facilityId: string;
  }) {
    const facility = await this.adminClient.getFacilityById(config.facilityId);
    return facility.payload;
  }

  public async getTopRecyclers() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const topRecyclers = await prismaClient.recycleSchedule.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: oneMonthAgo } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const users = await prismaClient.user.findMany({
      where: { id: { in: topRecyclers.map((r) => r.userId) } },
      select: { id: true, firstName: true, lastName: true, image: true },
    });

    return topRecyclers.map((recycler) => {
      const user = users.find((u) => u.id === recycler.userId);

      return {
        userId: recycler.userId,
        recycleCount: recycler._count.id,
        user: user
          ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
          }
          : null,
      };
    });
  }

  private async resolveScheduleFacility(facilityId: string) {
    try {
      const facility = await this.adminClient.getFacilityById(facilityId);
      return mapPublicFacility(facility.payload);
    } catch {
      return mapPublicFacility({
        id: facilityId,
        name: "Unknown facility",
        rating: 0,
        profilePhoto: "",
        currency: "NGN",
        workingDays: [],
        materialUnitPrice: [],
        distanceInMiles: 0,
      });
    }
  }

  private async resolveScheduleMaterial(materialId: string) {
    try {
      const material = await this.adminClient.getMaterialById(materialId);
      return mapPublicMaterial(material.payload);
    } catch {
      return mapPublicMaterial({ id: materialId, category: materialId });
    }
  }

  public async getCompletedRecycleSchedules(config: { userId: string }) {
    const schedules = await prismaClient.recycleSchedule.findMany({
      where: { userId: config.userId, 
        status: {
          in: [
            RecycleScheduleStatus.COMPLETED,
            RecycleScheduleStatus.IN_PROGRESS,
            RecycleScheduleStatus.PENDING,
          ],
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Promise.all(
      schedules.map(async (schedule) =>
        mapCompletedScheduleRow({
          id: schedule.id,
          status: schedule.status,
          type: schedule.type,
          updatedAt: schedule.updatedAt,
          userId: schedule.userId,
          facilityId: schedule.facility,
          materialId: schedule.material,
          quantity: schedule.quantity,
          dates: schedule.dates,
          facility: await this.resolveScheduleFacility(schedule.facility),
          material: await this.resolveScheduleMaterial(schedule.material),
        })
      )
    );
  }

  public async getUserRecyclingAnalytics(
    userId: string,
    timeRange?: { start?: Date; end?: Date }
  ) {
    const where: any = {
      userId,
      status: {
        in: [
          RecycleScheduleStatus.COMPLETED,
          RecycleScheduleStatus.IN_PROGRESS,
          RecycleScheduleStatus.PENDING,
        ],
      },
      ...(timeRange && {
        createdAt: {
          ...(timeRange.start && { gte: timeRange.start }),
          ...(timeRange.end && { lte: timeRange.end }),
        },
      }),
    };

    const recyclingByMaterial = await prismaClient.recycleSchedule.groupBy({
      by: ["material"],
      where,
      _count: { id: true },
    });

    let allMaterials: IMaterialData[] = [];
    try {
      const materialsResponse = await this.adminClient.getMaterial();
      allMaterials = materialsResponse.payload;
    } catch {
      allMaterials = [];
    }

    return filterAnalyticsRowsForMobile(
      buildUserRecyclingAnalyticsRows(recyclingByMaterial, allMaterials)
    );
  }
}
