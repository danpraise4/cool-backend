"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthAdminService = void 0;
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const app_constants_1 = require("../../../shared/config/app.constants");
const encryption_service_1 = __importDefault(require("../../../shared/services/encryption.service"));
const token_service_1 = __importDefault(require("../../../shared/services/token.service"));
const otp_service_1 = require("../../otp/otp.service");
const auth_utils_1 = require("../auth.utils");
const app_exception_1 = __importDefault(require("../../../infastructure/https/exception/app.exception"));
const http_status_1 = __importDefault(require("http-status"));
class AuthAdminService {
    otpService = new otp_service_1.OtpService();
    encryptionService = new encryption_service_1.default();
    tokenService = new token_service_1.default();
    async register(identifier) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const verifiedAdmin = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value, status: app_constants_1.STATUS.VERIFIED },
        });
        if (verifiedAdmin) {
            throw new app_exception_1.default("This account is already registered", http_status_1.default.CONFLICT);
        }
        const pendingAdmin = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value, status: app_constants_1.STATUS.PENDING },
        });
        if (pendingAdmin) {
            const token = await this.otpService.createOtp(identifierData.value);
            return { user: pendingAdmin, token };
        }
        const newAdmin = await connect_1.default.admin.create({
            data: {
                [identifierData.type]: identifierData.value,
                firstName: "",
                lastName: "",
            },
            select: {
                id: true,
                [identifierData.type]: true,
                firstName: true,
                lastName: true,
                createdAt: true,
            },
        });
        const token = await this.otpService.createOtp(identifierData.value);
        return { user: newAdmin, token };
    }
    async verifyOtp(identifier, otp) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const admin = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!admin) {
            throw new app_exception_1.default("Admin not found", http_status_1.default.NOT_FOUND);
        }
        const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);
        if (!verifiedOtp) {
            throw new app_exception_1.default("Invalid OTP", http_status_1.default.BAD_REQUEST);
        }
        const updatedAdmin = await connect_1.default.admin.update({
            where: { id: admin.id },
            data: { status: app_constants_1.STATUS.VERIFIED, isEmailVerified: true },
            select: { id: true, email: true, createdAt: true },
        });
        return { admin: updatedAdmin, otp: verifiedOtp };
    }
    async completeRegistration(data) {
        const otp = await this.otpService.getOtp(data.token);
        if (!otp) {
            throw new app_exception_1.default("Invalid or expired token", http_status_1.default.BAD_REQUEST);
        }
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(otp.identifier);
        const admin = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!admin) {
            throw new app_exception_1.default("Admin not found", http_status_1.default.NOT_FOUND);
        }
        const alreadyComplete = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value, password: { not: null } },
        });
        if (alreadyComplete) {
            throw new app_exception_1.default("Registration already completed", http_status_1.default.CONFLICT);
        }
        const hashedPassword = await this.encryptionService.hashPassword(data.password.trim());
        const updatedAdmin = await connect_1.default.admin.update({
            where: { id: admin.id },
            data: {
                [identifierData.type]: identifierData.value,
                firstName: data.firstName,
                lastName: data.lastName,
                password: hashedPassword,
                status: app_constants_1.STATUS.COMPLETED,
            },
        });
        await this.otpService.deleteOtp(otp.id);
        return updatedAdmin;
    }
    async login(identifier, password) {
        const identifierData = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        const admin = await connect_1.default.admin.findFirst({
            where: { [identifierData.type]: identifierData.value },
        });
        if (!admin) {
            throw new app_exception_1.default("Invalid credentials", http_status_1.default.UNAUTHORIZED);
        }
        if (admin.status !== app_constants_1.STATUS.COMPLETED || !admin.password) {
            throw new app_exception_1.default("Registration not complete. Please finish setting up your account.", http_status_1.default.FORBIDDEN);
        }
        const isPasswordValid = await this.encryptionService.comparePassword(admin.password, password);
        if (!isPasswordValid) {
            throw new app_exception_1.default("Invalid credentials", http_status_1.default.UNAUTHORIZED);
        }
        return admin;
    }
    async generateToken(id, name) {
        return this.tokenService.generateToken(id, name);
    }
    async logout(id) {
        await this.tokenService.deleteToken(id);
    }
    async updatePassword(adminId, newPassword, passwordConfirmation, oldPassword) {
        if (newPassword !== passwordConfirmation) {
            throw new app_exception_1.default("New password and confirmation do not match", http_status_1.default.BAD_REQUEST);
        }
        const admin = await connect_1.default.admin.findUnique({ where: { id: adminId } });
        if (!admin || !admin.password) {
            throw new app_exception_1.default("Admin not found", http_status_1.default.NOT_FOUND);
        }
        const isOldPasswordValid = await this.encryptionService.comparePassword(admin.password, oldPassword);
        if (!isOldPasswordValid) {
            throw new app_exception_1.default("Current password is incorrect", http_status_1.default.BAD_REQUEST);
        }
        const isSamePassword = await this.encryptionService.comparePassword(admin.password, newPassword);
        if (isSamePassword) {
            throw new app_exception_1.default("New password cannot be the same as current password", http_status_1.default.BAD_REQUEST);
        }
        const hashedPassword = await this.encryptionService.hashPassword(newPassword);
        return connect_1.default.admin.update({
            where: { id: adminId },
            data: { password: hashedPassword },
        });
    }
}
exports.AuthAdminService = AuthAdminService;
