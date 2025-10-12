"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_user_middleware_1 = require("../../infastructure/https/middlewares/auth.user.middleware");
const controller_module_1 = require("../../infastructure/https/controller/controller.module");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const user_validator_1 = require("./user.validator");
const auth_validator_1 = require("../authentication/validators/auth.validator");
const router = (0, express_1.Router)();
router
    .route("/")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.getUser)
    .post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(user_validator_1.updateUserValidator), controller_module_1.userController.updateUser);
router
    .route("/update-image")
    .put(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(user_validator_1.uploadImageValidator), controller_module_1.userController.uploadImage);
router
    .route("/update-location")
    .patch(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.updateLocation);
router.route("/update-device").patch(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(auth_validator_1.updateDeviceValidator), controller_module_1.userController.updateDeviceToken);
router
    .route("/update-settings")
    .patch(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(auth_validator_1.updateSettingsValidator), controller_module_1.userController.updateSettings);
router.route("/get-home-charities").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.getHomeCharities);
router.route("/get-home-facilities").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.getHomeFacilities);
router.route("/get-home-heroes").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.getHomeHeroes);
router.route("/get-home-top-deals").get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.getHomeTopDeals);
router.route("/delete").delete(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.deleteUser);
// Notifications
router
    .route("/get-notifications")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.getNotifications);
router
    .route("/mark-notification-as-read/:id")
    .patch(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.markNotificationAsRead);
router
    .route("/mark-notification-as-unread/:id")
    .patch(auth_user_middleware_1.isUserAuthenticated, controller_module_1.userController.markNotificationAsUnread);
exports.default = router;
