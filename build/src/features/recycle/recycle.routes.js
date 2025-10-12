"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_user_middleware_1 = require("../../infastructure/https/middlewares/auth.user.middleware");
const controller_module_1 = require("../../infastructure/https/controller/controller.module");
const app_validate_1 = __importDefault(require("../../infastructure/https/validation/app.validate"));
const recycle_validator_1 = require("./recycle.validator");
const router = (0, express_1.Router)();
router
    .route("/")
    .get(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(recycle_validator_1.getRecycleSchedulesValidator), controller_module_1.recycleController.getRecycleSchedules);
router
    .route("/dates")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getRecycleScheduleDates);
router
    .route("/chats")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getRecycleChats);
router
    .route("/facility-data/:id")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getRecycleFacilityData);
router.route("/admin/chats/:id").get(controller_module_1.recycleController.getFacilityChatById);
router
    .route("/chats/initiate")
    .post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.initiateRecycleChat);
router
    .route("/get-schedule")
    .post(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getRecycleScheduleByTransactionId);
router
    .route("/admin/chats/initiate")
    .post((0, app_validate_1.default)(recycle_validator_1.adminChatValidator), controller_module_1.recycleController.initiateAdminRecycleChat);
router
    .route("/top-recyclers")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getTopRecyclers);
router
    .route("/analytics")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getUserRecyclingAnalytics);
router
    .route("/completed-schedules")
    .get(auth_user_middleware_1.isUserAuthenticated, controller_module_1.recycleController.getCompletedRecycleSchedules);
router
    .route("/:id")
    .get(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(recycle_validator_1.getRecycleSchedulesSingleValidator), controller_module_1.recycleController.getRecycleSchedulesById);
router
    .route("/")
    .post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(recycle_validator_1.createRecycleScheduleValidator), controller_module_1.recycleController.createRecycleSchedule);
// update recycle schedule
router
    .route("/:id")
    .post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(recycle_validator_1.updateRecycleScheduleValidator), controller_module_1.recycleController.updateRecycleSchedule);
exports.default = router;
