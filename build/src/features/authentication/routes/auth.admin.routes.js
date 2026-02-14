"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const app_validate_1 = __importDefault(require("../../../infastructure/https/validation/app.validate"));
const auth_validator_1 = require("../validators/auth.validator");
const controller_module_1 = require("../../../infastructure/https/controller/controller.module");
const auth_user_middleware_1 = require("../../../infastructure/https/middlewares/auth.user.middleware");
const router = (0, express_1.Router)();
// Create new User Profile
router
    .route("/login")
    .post((0, app_validate_1.default)(auth_validator_1.loginValidator), controller_module_1.authAdminController.login);
// Register User
router
    .route("/register")
    .post((0, app_validate_1.default)(auth_validator_1.registerCompleteValidator), controller_module_1.authAdminController.register);
// Verify OTP
router
    .route("/verify-otp")
    .post((0, app_validate_1.default)(auth_validator_1.verifyOtpValidator), controller_module_1.authAdminController.verifyOtp);
router
    .route("/update-password")
    .post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(auth_validator_1.updatePasswordValidator), controller_module_1.authAdminController.updatePassword);
exports.default = router;
