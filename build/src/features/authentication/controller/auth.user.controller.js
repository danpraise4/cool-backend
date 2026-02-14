"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../../infastructure/https/exception/app.exception"));
class AuthUserController {
    authService;
    locationService;
    userService;
    constructor(authService, locationService, userService) {
        this.authService = authService;
        this.locationService = locationService;
        this.userService = userService;
    }
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await this.authService.login(email, password);
            // generate token
            if (result.status === 200) {
                const token = await this.authService.generateToken(result.user.id, `${result.user.firstName} ${result.user.lastName}`);
                res.status(http_status_1.default.OK).json({
                    message: "Login successful",
                    data: {
                        user: result.user,
                        token,
                    },
                });
            }
            else {
                return res.status(result.status).json(result);
            }
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    register = async (req, res, next) => {
        try {
            const data = await this.authService.register(req.body);
            res.status(http_status_1.default.OK).json({
                message: `Register successful. For testing purposes, your OTP is ${data.token}`,
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    verifyOtp = async (req, res, next) => {
        try {
            const { identifier, otp } = req.body;
            const data = await this.authService.verifyOtp(identifier, otp);
            res.status(http_status_1.default.OK).json({
                message: "OTP verified successfully",
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    checkUser = async (req, res, next) => {
        try {
            const { identifier } = req.body;
            const data = await this.authService.checkUser(identifier);
            res.status(http_status_1.default.OK).json({
                message: `User checked successfully. For testing purposes, your OTP is ${data}`,
                status: "success",
                data: {
                    email_available: true,
                },
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    resendOtp = async (req, res, next) => {
        try {
            const { identifier } = req.body;
            const data = await this.authService.resendOtp(identifier);
            res.status(http_status_1.default.OK).json({
                message: "OTP resent successfully",
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    updatePassword = async (req, res, next) => {
        try {
            const { oldPassword, password, passwordConfirmation } = req.body;
            const user = req.user;
            const updatedUser = await this.authService.updatePassword(user, password, passwordConfirmation, oldPassword);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Password updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Google Auth
    googleAuth = async (req, res, next) => {
        try {
            const data = await this.authService.googleAuth(req.body);
            res.status(http_status_1.default.OK).json({
                message: "Google auth successful",
                status: "success",
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    getLocation = async (req, res, next) => {
        try {
            const { lat, long } = req.query;
            const location = await this.locationService.getCititiesfromLatLong({
                lat: Number(lat),
                long: Number(long),
            });
            res.status(http_status_1.default.OK).json({
                message: "Location fetched successfully",
                data: location,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    // Reset password
    resetPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const data = await this.authService.resetPassword(email);
            res.status(http_status_1.default.OK).json({
                message: "Password reset successful",
                status: "success",
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    verifyResetPassword = async (req, res, next) => {
        try {
            const { email, otp } = req.body;
            const data = await this.authService.verifyResetPassword(email, otp);
            res.status(http_status_1.default.OK).json({
                message: "Password reset successful",
                status: "success",
                data,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    resetPasswordUpdate = async (req, res, next) => {
        try {
            const { password, passwordConfirmation, token } = req.body;
            const updatedUser = await this.authService.resetPasswordUpdate(password, passwordConfirmation, token);
            res.status(http_status_1.default.OK).json({
                status: "success",
                message: "Password updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
}
exports.default = AuthUserController;
