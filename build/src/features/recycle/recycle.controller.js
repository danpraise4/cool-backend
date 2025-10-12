"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecycleController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_2 = __importDefault(require("http-status"));
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
            res.status(http_status_1.default.CREATED).json({
                message: "Schedule created successfully",
                data: schedule,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getRecycleScheduleByTransactionId = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.getRecycleScheduleByTransactionId({
                recyclerId: req.user.id,
                transactionId: req.body.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "Schedule fetched successfully",
                status: "success",
                data: schedule,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updateRecycleSchedule = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.updateRecycleSchedule({
                id: req.params.id,
                userId: req.user.id,
                schedule: req.body,
            });
            res.status(http_status_1.default.OK).json({
                message: "Schedule updated successfully",
                status: "success",
                data: schedule,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getRecycleSchedules = async (req, res, next) => {
        try {
            const { date } = req.query;
            const schedules = await this.recycleService.getRecycleSchedules({
                userId: req.user.id,
                date: date,
            });
            console.log("schedules", schedules);
            res.status(http_status_1.default.OK).json({
                message: "Schedules fetched successfully",
                data: schedules,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getRecycleSchedulesById = async (req, res, next) => {
        try {
            const schedule = await this.recycleService.getRecycleSchedule({
                id: req.params.id,
                userId: req.user.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "Schedule fetched successfully",
                data: schedule,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getRecycleScheduleDates = async (req, res, next) => {
        try {
            const schedules = await this.recycleService.getRecycleScheduleDates({
                userId: req.user.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "Schedules fetched successfully",
                data: schedules,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // recycle chat
    getRecycleChats = async (req, res, next) => {
        try {
            const chats = await this.recycleService.getRecycleChats({
                userID: req.user.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "Chats fetched successfully",
                data: chats,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // get recycle facility data
    getRecycleFacilityData = async (req, res, next) => {
        try {
            const { id } = req.params;
            const facilityData = await this.recycleService.getRecycleFacilityData({
                userID: req.user.id,
                facilityId: id,
            });
            console.log("facilityData", facilityData);
            res.status(http_status_1.default.OK).json({
                message: "Facility data fetched successfully",
                status: "success",
                data: facilityData,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getFacilityChatById = async (req, res, next) => {
        try {
            const chat = await this.recycleService.getRecycleChats({
                userID: req.params.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "Chat fetched successfully",
                status: "success",
                data: chat,
            });
        }
        catch (error) {
            console.log("error", error);
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // initiate recycle chat
    initiateRecycleChat = async (req, res, next) => {
        try {
            const chat = await this.recycleService.initiateRecycleChat({
                userID: req.user.id,
                withID: req.body.withID,
                type: req.body.type,
            });
            res.status(http_status_1.default.OK).json({
                message: "Chat initiated successfully",
                status: "success",
                data: chat,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // initiate recycle chat
    initiateAdminRecycleChat = async (req, res, next) => {
        try {
            const chat = await this.recycleService.initiateRecycleChat({
                withID: req.body.withID,
                userID: req.body.userID,
                type: req.body.type,
            });
            res.status(http_status_1.default.OK).json({
                message: "Chat initiated successfully",
                status: "success",
                data: chat,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // User Recycling Analytics
    getUserRecyclingAnalytics = async (req, res, next) => {
        const { start, end } = req.query;
        try {
            const userAnalytics = await this.recycleService.getUserRecyclingAnalytics(req.user.id, {
                start: start ? new Date(start) : undefined,
                end: end ? new Date(end) : undefined,
            });
            res.status(http_status_1.default.OK).json({
                message: "User recycling analytics fetched successfully",
                data: userAnalytics,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // Completed Recycle Schedules
    getCompletedRecycleSchedules = async (req, res, next) => {
        try {
            const completedRecycleSchedules = await this.recycleService.getCompletedRecycleSchedules({
                userId: req.user.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "Completed recycle schedules fetched successfully",
                status: "success",
                data: completedRecycleSchedules,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // Top Recyclers
    getTopRecyclers = async (_req, res, next) => {
        try {
            const topRecyclers = await this.recycleService.getTopRecyclers();
            res.status(http_status_1.default.OK).json({
                message: "Top recyclers fetched successfully",
                status: "success",
                data: topRecyclers,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
}
exports.RecycleController = RecycleController;
