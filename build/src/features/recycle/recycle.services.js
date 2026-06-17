"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecycleService = void 0;
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const helper_1 = require("../../shared/helper/helper");
const adminservice_client_1 = __importDefault(require("../../shared/services/admin/adminservice.client"));
const adminservice_1 = __importDefault(require("../../shared/services/admin/adminservice"));
const client_1 = require("@prisma/client");
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
const region_1 = require("../../shared/config/region");
const email_notification_service_1 = require("../../shared/services/email/email-notification.service");
const notification_service_1 = require("../../shared/services/notification/notification.service");
const recycle_public_utils_1 = require("./recycle.public.utils");
class RecycleService {
    adminClient;
    constructor() {
        this.adminClient = new adminservice_client_1.default(new adminservice_1.default()).build();
    }
    async createRecycleSchedule(config) {
        const { type, facilityId, materialId, dates } = config.schedule;
        const { id: userId, firstName, lastName, email, phone, address } = config.user;
        const [facility, material] = await Promise.all([
            this.adminClient.getFacilityById(facilityId),
            this.adminClient.getMaterialById(materialId),
        ]);
        if (!facility) {
            throw new app_exception_1.default("Facility not found", http_status_1.default.NOT_FOUND);
        }
        if (!material) {
            throw new app_exception_1.default("Material not found", http_status_1.default.NOT_FOUND);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allFuture = dates.every((date) => {
            const d = helper_1.Helper.toDate(date);
            d.setHours(0, 0, 0, 0);
            return d >= today;
        });
        if (!allFuture) {
            throw new app_exception_1.default("All dates must be today or in the future", http_status_1.default.BAD_REQUEST);
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
                    country: (0, region_1.getCountryForCity)(config.user.cityOfResidence),
                },
            },
            recycle: {
                collectionMethod: type === "PICKUP" ? 1 : 2,
                materialId: material.payload.id,
                quantity: config.schedule.quantity || 0,
                scheduledCollectionDate: helper_1.Helper.toDate(dates[0]).toISOString(),
            },
        });
        const schedule = await connect_1.default.recycleSchedule.create({
            data: {
                type,
                transactionId: adminRequest.payload.transactionId,
                facility: facility.payload.id.toString(),
                material: material.payload.id.toString(),
                dates: dates.map((d) => helper_1.Helper.toDate(d)),
                quantity: config.schedule.quantity || 0,
                userId,
            },
        });
        email_notification_service_1.emailNotificationService.notifyUser(userId, email_notification_service_1.EmailNotificationType.RECYCLE_REQUEST_SUBMITTED, {
            firstName,
            facilityName: facility.payload.name,
            materialName: material.payload.category,
            scheduledDate: helper_1.Helper.toDate(dates[0]).toLocaleDateString("en-GB"),
        });
        void notification_service_1.notificationService.createAndSend(userId, {
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
    async updateRecycleSchedule(config) {
        const existingSchedule = await connect_1.default.recycleSchedule.findFirst({
            where: { id: config.id, userId: config.userId },
        });
        if (!existingSchedule) {
            throw new app_exception_1.default("Schedule not found or you don't have permission to update it", http_status_1.default.NOT_FOUND);
        }
        if (!existingSchedule.transactionId) {
            throw new app_exception_1.default("This schedule cannot be updated because it has no linked facility request", http_status_1.default.BAD_REQUEST);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledDate = helper_1.Helper.toDate(config.schedule.scheduledCollectionDate);
        scheduledDate.setHours(0, 0, 0, 0);
        if (scheduledDate < today) {
            throw new app_exception_1.default("Scheduled date must be today or in the future", http_status_1.default.BAD_REQUEST);
        }
        await this.adminClient.updateRecycleRequest(existingSchedule.transactionId, {
            recyclerAppId: config.userId,
            transactionStatus: config.schedule.transactionStatus,
            scheduledCollectionDate: scheduledDate.toISOString(),
            quantity: config.schedule.quantity || 0,
        });
        const updatedSchedule = await connect_1.default.recycleSchedule.update({
            where: { id: config.id },
            data: {
                dates: [scheduledDate],
                status: helper_1.Helper.matchStatus(config.schedule.transactionStatus),
                quantity: config.schedule.quantity ?? existingSchedule.quantity ?? 1,
            },
        });
        const newStatus = updatedSchedule.status;
        if (newStatus === client_1.RecycleScheduleStatus.COMPLETED) {
            void notification_service_1.notificationService.createAndSend(config.userId, {
                title: "Recycle completed",
                body: "Your recycling schedule was marked as completed.",
                link: "/recycle",
                type: "RECYCLE_COMPLETED",
                data: {
                    type: "RECYCLE_COMPLETED",
                    scheduleId: config.id,
                },
            });
        }
        else if (newStatus === client_1.RecycleScheduleStatus.CANCELLED) {
            void notification_service_1.notificationService.createAndSend(config.userId, {
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
    async getRecycleScheduleByTransactionId(config) {
        const schedule = await connect_1.default.recycleSchedule.findFirst({
            where: { id: config.transactionId },
        });
        if (!schedule) {
            throw new app_exception_1.default("Schedule not found", http_status_1.default.NOT_FOUND);
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
    async createRecycleScheduleReminder(config) {
        const findSchedule = await connect_1.default.recycleSchedule.findUnique({
            where: { id: config.scheduleid },
            include: { reminders: true },
        });
        if (!findSchedule) {
            throw new app_exception_1.default("Schedule not found", http_status_1.default.NOT_FOUND);
        }
        if (findSchedule.reminders.length > 0) {
            throw new app_exception_1.default("Reminder already exists", http_status_1.default.CONFLICT);
        }
        const scheduleDate = findSchedule.dates[0];
        if (!scheduleDate) {
            throw new app_exception_1.default("No scheduled date found", http_status_1.default.BAD_REQUEST);
        }
        const dayBefore = new Date(scheduleDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        dayBefore.setHours(15, 0, 0, 0);
        const sameDay = new Date(scheduleDate);
        sameDay.setHours(7, 0, 0, 0);
        return Promise.all([
            connect_1.default.recycleReminder.create({
                data: { userId: config.userId, scheduleId: config.scheduleid, remindAt: dayBefore },
            }),
            connect_1.default.recycleReminder.create({
                data: { userId: config.userId, scheduleId: config.scheduleid, remindAt: sameDay },
            }),
        ]);
    }
    async deleteRecycleSchedule(config) {
        return connect_1.default.recycleSchedule.delete({
            where: { id: config.id, userId: config.userId },
        });
    }
    async getRecycleSchedule(config) {
        const schedule = await connect_1.default.recycleSchedule.findFirst({
            where: { id: config.id, userId: config.userId },
            include: { reminders: true },
        });
        if (!schedule) {
            throw new app_exception_1.default("Schedule not found", http_status_1.default.NOT_FOUND);
        }
        return schedule;
    }
    async getRecycleSchedules(config) {
        const date = helper_1.Helper.toDate(config.date);
        const schedules = await connect_1.default.recycleSchedule.findMany({
            where: { userId: config.userId, dates: { has: date } },
            include: { reminders: true },
        });
        return Promise.all(schedules.map(async (schedule) => {
            const [facility, material] = await Promise.all([
                this.adminClient.getFacilityById(schedule.facility),
                this.adminClient.getMaterialById(schedule.material),
            ]);
            return { ...schedule, facility: facility.payload, material: material.payload };
        }));
    }
    async getRecycleScheduleDates(config) {
        const schedules = await connect_1.default.recycleSchedule.findMany({
            where: { userId: config.userId },
            select: { dates: true },
        });
        return schedules.flatMap((s) => s.dates);
    }
    async initiateRecycleChat(config) {
        const { userID, withID, type } = config;
        const chatID = helper_1.Helper.generateChatID(userID, withID);
        const existing = await connect_1.default.recycleChat.findFirst({
            where: { chatID, OR: [{ createdBy: userID }, { withUser: userID }] },
        });
        if (existing)
            return existing;
        const user = await connect_1.default.user.findUnique({ where: { id: userID } });
        if (!user) {
            throw new app_exception_1.default("User not found", http_status_1.default.NOT_FOUND);
        }
        return connect_1.default.recycleChat.create({
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
    async sendRecycleChatMessage(config) {
        const { chatID, message, userID } = config;
        const chat = await connect_1.default.recycleChat.findUnique({ where: { id: chatID } });
        if (!chat) {
            throw new app_exception_1.default("Chat not found", http_status_1.default.NOT_FOUND);
        }
        const newMessage = await connect_1.default.recycleChatMessage.create({
            data: { message, senderID: userID, recycleChatId: chatID },
        });
        await connect_1.default.recycleChat.update({
            where: { id: chat.id },
            data: { lastMessage: { connect: { id: newMessage.id } } },
        });
        return newMessage;
    }
    async getRecycleChatMessages(config) {
        return connect_1.default.recycleChatMessage.findMany({
            where: { recycleChatId: config.chatID },
        });
    }
    async getRecycleChats(config) {
        return connect_1.default.recycleChat.findMany({
            where: {
                OR: [{ createdBy: config.userID }, { withUser: config.userID }],
            },
            include: { lastMessage: true },
            orderBy: { lastMessage: { createdAt: "desc" } },
        });
    }
    async getRecycleFacilityData(config) {
        const facility = await this.adminClient.getFacilityById(config.facilityId);
        return facility.payload;
    }
    async getTopRecyclers() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const topRecyclers = await connect_1.default.recycleSchedule.groupBy({
            by: ["userId"],
            where: { createdAt: { gte: oneMonthAgo } },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
        });
        const users = await connect_1.default.user.findMany({
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
    async resolveScheduleFacility(facilityId) {
        try {
            const facility = await this.adminClient.getFacilityById(facilityId);
            return (0, recycle_public_utils_1.mapPublicFacility)(facility.payload);
        }
        catch {
            return (0, recycle_public_utils_1.mapPublicFacility)({
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
    async resolveScheduleMaterial(materialId) {
        try {
            const material = await this.adminClient.getMaterialById(materialId);
            return (0, recycle_public_utils_1.mapPublicMaterial)(material.payload);
        }
        catch {
            return (0, recycle_public_utils_1.mapPublicMaterial)({ id: materialId, category: materialId });
        }
    }
    async getCompletedRecycleSchedules(config) {
        const schedules = await connect_1.default.recycleSchedule.findMany({
            where: { userId: config.userId,
                status: {
                    in: [
                        client_1.RecycleScheduleStatus.COMPLETED,
                        client_1.RecycleScheduleStatus.IN_PROGRESS,
                        client_1.RecycleScheduleStatus.PENDING,
                    ],
                },
            },
            orderBy: { updatedAt: "desc" },
        });
        return Promise.all(schedules.map(async (schedule) => (0, recycle_public_utils_1.mapCompletedScheduleRow)({
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
        })));
    }
    async getUserRecyclingAnalytics(userId, timeRange) {
        const where = {
            userId,
            status: {
                in: [
                    client_1.RecycleScheduleStatus.COMPLETED,
                    client_1.RecycleScheduleStatus.IN_PROGRESS,
                    client_1.RecycleScheduleStatus.PENDING,
                ],
            },
            ...(timeRange && {
                createdAt: {
                    ...(timeRange.start && { gte: timeRange.start }),
                    ...(timeRange.end && { lte: timeRange.end }),
                },
            }),
        };
        const recyclingByMaterial = await connect_1.default.recycleSchedule.groupBy({
            by: ["material"],
            where,
            _count: { id: true },
        });
        let allMaterials = [];
        try {
            const materialsResponse = await this.adminClient.getMaterial();
            allMaterials = materialsResponse.payload;
        }
        catch {
            allMaterials = [];
        }
        return (0, recycle_public_utils_1.filterAnalyticsRowsForMobile)((0, recycle_public_utils_1.buildUserRecyclingAnalyticsRows)(recyclingByMaterial, allMaterials));
    }
}
exports.RecycleService = RecycleService;
