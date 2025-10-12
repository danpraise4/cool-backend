"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const http_status_2 = __importDefault(require("http-status"));
const pick_1 = __importDefault(require("../../shared/helper/pick"));
class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    getUser = async (req, res, next) => {
        try {
            const user = await this.userService.getUserById(req.user.id);
            const settings = await this.userService.getUserSettings(req.user.id);
            res.status(http_status_1.default.OK).json({
                message: "User fetched successfully",
                data: { user, settings },
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updateDeviceToken = async (req, res, next) => {
        try {
            const deviceToken = req.body.deviceToken;
            const userId = req.user.id;
            const updatedUser = await this.userService.updateDeviceToken(deviceToken, userId);
            res.status(http_status_1.default.OK).json({
                message: "Device token updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    uploadImage = async (req, res, next) => {
        try {
            const image = req.body.image;
            const userId = req.user.id;
            const updatedUser = await this.userService.uploadImage(image, userId);
            res.status(http_status_1.default.OK).json({
                message: "Image uploaded successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    deleteUser = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const deletedUser = await this.userService.deleteUser(userId);
            res.status(http_status_1.default.OK).json({
                message: "User deleted successfully",
                data: deletedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updateLocation = async (req, res, next) => {
        try {
            const location = req.body.location;
            const userId = req.user.id;
            const updatedUser = await this.userService.updateLocation(location, userId);
            res.status(http_status_1.default.OK).json({
                message: "Location updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updateSettings = async (req, res, next) => {
        try {
            const user = req.user;
            const data = await this.userService.updateSettings(user, req.body);
            res.status(http_status_2.default.OK).json({
                status: "success",
                message: "Settings updated successfully",
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    updateUser = async (req, res, next) => {
        try {
            const updatedUser = await this.userService.updateUser({
                ...req.body,
                id: req.user.id,
            });
            res.status(http_status_1.default.OK).json({
                message: "User updated successfully",
                data: { user: updatedUser },
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getHomeCharities = async (req, res, next) => {
        try {
            const homePage = await this.userService.getHomeCharities(req.user, {
                Latitude: Number(req.query.Latitude),
                Longitude: Number(req.query.Longitude),
            });
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Home page fetched successfully",
                data: homePage,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getHomeHeroes = async (req, res, next) => {
        try {
            const homePage = await this.userService.getHomeHeroes(req.user);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Home page fetched successfully",
                data: homePage,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getHomeTopDeals = async (req, res, next) => {
        try {
            const homePage = await this.userService.getHomeTopDeals(req.user, {
                Latitude: Number(req.query.Latitude),
                Longitude: Number(req.query.Longitude),
            });
            console.log("homePage", homePage);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Home page fetched successfully",
                data: homePage,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    getHomeFacilities = async (req, res, next) => {
        try {
            const params = (0, pick_1.default)(req.query, ["Latitude", "Longitude"]);
            const homePage = await this.userService.getHomeFacilities(req.user, params);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Home page fetched successfully",
                data: homePage,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    // Notifications
    getNotifications = async (req, res, next) => {
        try {
            const notifications = await this.userService.getNotifications(req.user);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Notifications fetched successfully",
                data: notifications,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    markNotificationAsRead = async (req, res, next) => {
        try {
            const notificationId = req.params.id;
            const notifications = await this.userService.markNotificationAsRead(req.user, notificationId);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Notifications marked as read successfully",
                data: notifications,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
    markNotificationAsUnread = async (req, res, next) => {
        try {
            const notificationId = req.params.id;
            const notifications = await this.userService.markNotificationAsUnread(req.user, notificationId);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Notifications marked as unread successfully",
                data: notifications,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_2.default.BAD_REQUEST));
        }
    };
}
exports.UserController = UserController;
