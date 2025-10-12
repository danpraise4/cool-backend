"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_module_1 = require("../../../infastructure/https/controller/controller.module");
const app_validate_1 = __importDefault(require("../../../infastructure/https/validation/app.validate"));
const auth_validator_1 = require("../validators/auth.validator");
const auth_user_middleware_1 = require("../../../infastructure/https/middlewares/auth.user.middleware");
const app_inalidate_catch_middleware_1 = __importDefault(require("../../../infastructure/https/middlewares/app.inalidate.catch.middleware"));
const router = (0, express_1.Router)();
// Create new User Profile
router.route("/login").post((0, app_validate_1.default)(auth_validator_1.loginValidator), controller_module_1.authUserController.login);
// Register User
router
    .route("/register")
    .post((0, app_validate_1.default)(auth_validator_1.registerCompleteValidator), controller_module_1.authUserController.register);
router
    .route("/validate-email")
    .post((0, app_validate_1.default)(auth_validator_1.checkUserValidator), controller_module_1.authUserController.checkUser);
// Verify OTP
router
    .route("/verify-otp")
    .post((0, app_validate_1.default)(auth_validator_1.verifyOtpValidator), controller_module_1.authUserController.verifyOtp);
// Resend OTP
router
    .route("/resend-otp")
    .post((0, app_validate_1.default)(auth_validator_1.resendOtpValidator), controller_module_1.authUserController.resendOtp);
router
    .route("/update-password")
    .post(auth_user_middleware_1.isUserAuthenticated, (0, app_validate_1.default)(auth_validator_1.updatePasswordValidator), controller_module_1.authUserController.updatePassword);
// Reset password
router
    .route("/reset-password")
    .post((0, app_validate_1.default)(auth_validator_1.resetPasswordValidator), controller_module_1.authUserController.resetPassword);
router
    .route("/verify-reset-password")
    .post((0, app_validate_1.default)(auth_validator_1.verifyResetPasswordValidator), controller_module_1.authUserController.verifyResetPassword);
router
    .route("/reset-password-update")
    .post((0, app_validate_1.default)(auth_validator_1.resetPasswordUpdateValidator), controller_module_1.authUserController.resetPasswordUpdate);
router
    .route("/google-auth")
    .post((0, app_validate_1.default)(auth_validator_1.googleAuthValidator), controller_module_1.authUserController.googleAuth);
router
    .route("/get-location")
    .get(app_inalidate_catch_middleware_1.default, (0, app_validate_1.default)(auth_validator_1.getCititiesfromLatLongValidator), controller_module_1.authUserController.getLocation);
exports.default = router;
