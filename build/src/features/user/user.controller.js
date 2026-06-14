"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../shared/helper/response");
const pick_1 = __importDefault(require("../../shared/helper/pick"));
class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    getUser = async (req, res, next) => {
        try {
            const [user, settings] = await Promise.all([
                this.userService.getUserById(req.user.id),
                this.userService.getUserSettings(req.user.id),
            ]);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "User fetched successfully",
                data: { user, settings },
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateDeviceToken = async (req, res, next) => {
        try {
            const updated = await this.userService.updateDeviceToken(req.body.deviceToken, req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Device token updated successfully",
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    };
    uploadImage = async (req, res, next) => {
        try {
            const updated = await this.userService.uploadImage(req.body.image, req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Image uploaded successfully",
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    };
    deleteUser = async (req, res, next) => {
        try {
            const result = await this.userService.deleteUser(req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Account deleted successfully", data: result });
        }
        catch (error) {
            next(error);
        }
    };
    updateLocation = async (req, res, next) => {
        try {
            const updated = await this.userService.updateLocation(req.body.location, req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Location updated successfully",
                data: updated,
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateSettings = async (req, res, next) => {
        try {
            const data = await this.userService.updateSettings(req.user, req.body);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Settings updated successfully", data });
        }
        catch (error) {
            next(error);
        }
    };
    updateUser = async (req, res, next) => {
        try {
            const updated = await this.userService.updateUser({ ...req.body, id: req.user.id });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "User updated successfully",
                data: { user: updated },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getHomeCharities = async (req, res, next) => {
        try {
            const data = await this.userService.getHomeCharities(req.user, {
                Latitude: Number(req.query.Latitude),
                Longitude: Number(req.query.Longitude),
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Charities fetched successfully", data });
        }
        catch (error) {
            next(error);
        }
    };
    getHomeHeroes = async (req, res, next) => {
        try {
            const data = await this.userService.getHomeHeroes(req.user);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Heroes fetched successfully", data });
        }
        catch (error) {
            next(error);
        }
    };
    getHomeTopDeals = async (req, res, next) => {
        try {
            const data = await this.userService.getHomeTopDeals(req.user, {
                Latitude: Number(req.query.Latitude),
                Longitude: Number(req.query.Longitude),
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Top deals fetched successfully", data });
        }
        catch (error) {
            next(error);
        }
    };
    getHomeFacilities = async (req, res, next) => {
        try {
            const params = (0, pick_1.default)(req.query, ["Latitude", "Longitude"]);
            const data = await this.userService.getHomeFacilities(req.user, params);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Facilities fetched successfully", data });
        }
        catch (error) {
            next(error);
        }
    };
    getNotifications = async (req, res, next) => {
        try {
            const notifications = await this.userService.getNotifications(req.user);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Notifications fetched successfully",
                data: notifications,
            });
        }
        catch (error) {
            next(error);
        }
    };
    markNotificationAsRead = async (req, res, next) => {
        try {
            const notification = await this.userService.markNotificationAsRead(req.user, req.params.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Notification marked as read",
                data: notification,
            });
        }
        catch (error) {
            next(error);
        }
    };
    markNotificationAsUnread = async (req, res, next) => {
        try {
            const notification = await this.userService.markNotificationAsUnread(req.user, req.params.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Notification marked as unread",
                data: notification,
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UserController = UserController;
