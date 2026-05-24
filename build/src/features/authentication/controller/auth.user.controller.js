"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../shared/helper/response");
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
            const { user } = await this.authService.login(email, password);
            const token = await this.authService.generateToken(user.id, `${user.firstName} ${user.lastName}`);
            delete user.password;
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Login successful",
                data: { user, token },
            });
        }
        catch (error) {
            next(error);
        }
    };
    register = async (req, res, next) => {
        try {
            const data = await this.authService.register(req.body);
            delete data.user.password;
            (0, response_1.sendSuccess)(res, http_status_1.default.CREATED, {
                message: "Registration successful",
                data: { user: data.user, token: data.token },
            });
        }
        catch (error) {
            next(error);
        }
    };
    verifyOtp = async (req, res, next) => {
        try {
            const { identifier, otp } = req.body;
            const data = await this.authService.verifyOtp(identifier, otp);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "OTP verified successfully",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    };
    checkUser = async (req, res, next) => {
        try {
            const { identifier } = req.body;
            await this.authService.checkUser(identifier);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Email is available",
                data: { email_available: true },
            });
        }
        catch (error) {
            next(error);
        }
    };
    resendOtp = async (req, res, next) => {
        try {
            const { identifier } = req.body;
            await this.authService.resendOtp(identifier);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "OTP resent successfully" });
        }
        catch (error) {
            next(error);
        }
    };
    updatePassword = async (req, res, next) => {
        try {
            const { oldPassword, password, passwordConfirmation } = req.body;
            await this.authService.updatePassword(req.user, password, passwordConfirmation, oldPassword);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Password updated successfully" });
        }
        catch (error) {
            next(error);
        }
    };
    googleAuth = async (req, res, next) => {
        try {
            const data = await this.authService.googleAuth(req.body);
            delete data.user.password;
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Google authentication successful",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getLocation = async (req, res, next) => {
        try {
            const { lat, long } = req.query;
            const location = await this.locationService.getCititiesfromLatLong({
                lat: Number(lat),
                long: Number(long),
            });
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Location fetched successfully",
                data: location,
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            await this.authService.resetPassword(email);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Password reset OTP sent to your email",
            });
        }
        catch (error) {
            next(error);
        }
    };
    verifyResetPassword = async (req, res, next) => {
        try {
            const { email, otp } = req.body;
            const data = await this.authService.verifyResetPassword(email, otp);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "OTP verified successfully",
                data,
            });
        }
        catch (error) {
            next(error);
        }
    };
    resetPasswordUpdate = async (req, res, next) => {
        try {
            const { password, passwordConfirmation, token } = req.body;
            await this.authService.resetPasswordUpdate(password, passwordConfirmation, token);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Password updated successfully" });
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            await this.authService.logout(req.user.id);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Logged out successfully" });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.default = AuthUserController;
