"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("../../../infastructure/https/exception/app.exception"));
class AuthAdminController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login = async (req, res, next) => {
        try {
            const { phone, password } = req.body;
            // login user
            console.log(phone, password);
            const user = await this.authService.login(phone, password);
            // generate token
            const token = await this.authService.generateToken(user.id, `${user.firstName} ${user.lastName}`);
            res.status(http_status_1.default.OK).json({
                message: "Login successful",
                data: {
                    user,
                    token,
                },
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    register = async (req, res, next) => {
        try {
            const { identifier } = req.body;
            const { user, token } = await this.authService.register(identifier);
            res.status(http_status_1.default.OK).json({
                message: `Register successful. For testing purposes, your OTP is ${token}`,
                data: user,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    verifyOtp = async (req, res, next) => {
        try {
            //
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
    completeRegistration = async (req, res, next) => {
        try {
            if (req.body.password !== req.body.confirmPassword) {
                throw new app_exception_1.default("Password and confirm password do not match", http_status_1.default.BAD_REQUEST);
            }
            delete req.body.confirmPassword;
            const data = req.body;
            const user = await this.authService.completeRegistration(data);
            const token = await this.authService.generateToken(user.id, `${user.firstName} ${user.lastName}`);
            res.status(http_status_1.default.OK).json({
                message: "Registration completed successfully",
                data: {
                    user,
                    token,
                },
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
    logout = async (_req, _res, _next) => { };
    refreshToken = async (_req, _res, _next) => { };
    forgotPassword = async (_req, _res, _next) => { };
    resetPassword = async (_req, _res, _next) => { };
    verifyEmail = async (_req, _res, _next) => { };
    verifyResetPassword = async (_req, _res, _next) => { };
    updatePassword = async (req, res, next) => {
        try {
            const { oldPassword, password, passwordConfirmation } = req.body;
            const user = req.user;
            const updatedUser = await this.authService.updatePassword(user, password, passwordConfirmation, oldPassword);
            res.status(http_status_1.default.OK).json({
                message: "Password updated successfully",
                data: updatedUser,
            });
        }
        catch (error) {
            return next(new app_exception_1.default(error.message, error.status || http_status_1.default.BAD_REQUEST));
        }
    };
}
exports.default = AuthAdminController;
