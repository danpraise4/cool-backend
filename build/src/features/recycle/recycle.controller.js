"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecycleController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const recycle_public_utils_1 = require("./recycle.public.utils");
class RecycleController {
    recycleService;
    constructor(recycleService) {
        this.recycleService = recycleService;
    }
    createRecycleSchedule = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.createRecycleSchedule({
                schedule: req.body,
                user: req.user,
            });
            res.status(http_status_1.default.CREATED).json({ message: "Schedule created successfully", data: schedule });
        }
        catch (error) {
            next(error);
        }
    };
    createRecycleScheduleReminder = async (req, res, next) => {
        try {
            const reminder = await this.recycleService.createRecycleScheduleReminder({
                userId: req.user.id,
                scheduleid: req.body.scheduleid,
            });
            res.status(http_status_1.default.OK).json({ message: "Reminder created successfully", status: "success", data: reminder });
        }
        catch (error) {
            next(error);
        }
    };
    getRecycleScheduleByTransactionId = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.getRecycleScheduleByTransactionId({
                recyclerId: req.user.id,
                transactionId: req.body.id,
            });
            res.status(http_status_1.default.OK).json({ message: "Schedule fetched successfully", status: "success", data: schedule });
        }
        catch (error) {
            next(error);
        }
    };
    updateRecycleSchedule = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.updateRecycleSchedule({
                id: req.params.id,
                userId: req.user.id,
                schedule: req.body,
            });
            res.status(http_status_1.default.OK).json({ message: "Schedule updated successfully", status: "success", data: schedule });
        }
        catch (error) {
            next(error);
        }
    };
    getRecycleSchedules = async (req, res, next) => {
        try {
            const schedules = await this.recycleService.getRecycleSchedules({
                userId: req.user.id,
                date: req.query.date,
            });
            res.status(http_status_1.default.OK).json({ message: "Schedules fetched successfully", data: schedules });
        }
        catch (error) {
            next(error);
        }
    };
    getRecycleSchedulesById = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.getRecycleSchedule({
                id: req.params.id,
                userId: req.user.id,
            });
            res.status(http_status_1.default.OK).json({ message: "Schedule fetched successfully", data: schedule });
        }
        catch (error) {
            next(error);
        }
    };
    getRecycleScheduleDates = async (req, res, next) => {
        try {
            const schedules = await this.recycleService.getRecycleScheduleDates({ userId: req.user.id });
            res.status(http_status_1.default.OK).json({ message: "Schedules fetched successfully", data: schedules });
        }
        catch (error) {
            next(error);
        }
    };
    getRecycleChats = async (req, res, next) => {
        try {
            const chats = await this.recycleService.getRecycleChats({ userID: req.user.id });
            res.status(http_status_1.default.OK).json({ message: "Chats fetched successfully", data: chats });
        }
        catch (error) {
            next(error);
        }
    };
    getRecycleFacilityData = async (req, res, next) => {
        try {
            const facilityData = await this.recycleService.getRecycleFacilityData({
                userID: req.user.id,
                facilityId: req.params.id,
            });
            res.status(http_status_1.default.OK).json({ message: "Facility data fetched successfully", status: "success", data: facilityData });
        }
        catch (error) {
            next(error);
        }
    };
    getFacilityChatById = async (req, res, next) => {
        try {
            const chat = await this.recycleService.getRecycleChats({ userID: req.params.id });
            res.status(http_status_1.default.OK).json({ message: "Chat fetched successfully", status: "success", data: chat });
        }
        catch (error) {
            next(error);
        }
    };
    initiateRecycleChat = async (req, res, next) => {
        try {
            const chat = await this.recycleService.initiateRecycleChat({
                userID: req.user.id,
                withID: req.body.withID,
                type: req.body.type,
            });
            res.status(http_status_1.default.OK).json({ message: "Chat initiated successfully", status: "success", data: chat });
        }
        catch (error) {
            next(error);
        }
    };
    initiateAdminRecycleChat = async (req, res, next) => {
        try {
            const chat = await this.recycleService.initiateRecycleChat({
                withID: req.body.withID,
                userID: req.body.userID,
                type: req.body.type,
            });
            res.status(http_status_1.default.OK).json({ message: "Chat initiated successfully", status: "success", data: chat });
        }
        catch (error) {
            next(error);
        }
    };
    getUserRecyclingAnalytics = async (req, res, next) => {
        const { start, end } = req.query;
        try {
            const targetUserId = await (0, recycle_public_utils_1.resolveRecycleTargetUserId)(req);
            const userAnalytics = await this.recycleService.getUserRecyclingAnalytics(targetUserId, {
                start: start ? new Date(start) : undefined,
                end: end ? new Date(end) : undefined,
            });
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "User recycling analytics fetched successfully",
                data: userAnalytics,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getCompletedRecycleSchedules = async (req, res, next) => {
        try {
            const targetUserId = await (0, recycle_public_utils_1.resolveRecycleTargetUserId)(req);
            const completedRecycleSchedules = await this.recycleService.getCompletedRecycleSchedules({ userId: targetUserId });
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Completed recycle schedules fetched successfully",
                data: completedRecycleSchedules,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getTopRecyclers = async (_req, res, next) => {
        try {
            const topRecyclers = await this.recycleService.getTopRecyclers();
            res.status(http_status_1.default.OK).json({ message: "Top recyclers fetched successfully", status: "success", data: topRecyclers });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.RecycleController = RecycleController;
