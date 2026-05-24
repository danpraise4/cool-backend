"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const response_1 = require("../../../shared/helper/response");
class AuthAdminController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login = async (req, res, next) => {
        try {
            const { phone, password } = req.body;
            const admin = await this.authService.login(phone, password);
            const token = await this.authService.generateToken(admin.id, `${admin.firstName} ${admin.lastName}`);
            delete admin.password;
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Login successful",
                data: { user: admin, token },
            });
        }
        catch (error) {
            next(error);
        }
    };
    register = async (req, res, next) => {
        try {
            const { identifier } = req.body;
            const { user } = await this.authService.register(identifier);
            (0, response_1.sendSuccess)(res, http_status_1.default.CREATED, {
                message: "OTP sent to your email/phone",
                data: user,
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
    completeRegistration = async (req, res, next) => {
        try {
            const data = req.body;
            const admin = await this.authService.completeRegistration(data);
            const token = await this.authService.generateToken(admin.id, `${admin.firstName} ${admin.lastName}`);
            delete admin.password;
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: "Registration completed successfully",
                data: { user: admin, token },
            });
        }
        catch (error) {
            next(error);
        }
    };
    updatePassword = async (req, res, next) => {
        try {
            const { oldPassword, password, passwordConfirmation } = req.body;
            await this.authService.updatePassword(req.user.id, password, passwordConfirmation, oldPassword);
            (0, response_1.sendSuccess)(res, http_status_1.default.OK, { message: "Password updated successfully" });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.default = AuthAdminController;
