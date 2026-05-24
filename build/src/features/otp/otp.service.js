"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const app_constants_1 = require("../../shared/config/app.constants");
const encryption_service_1 = __importDefault(require("../../shared/services/encryption.service"));
const helper_1 = require("../../shared/helper/helper");
const redis_service_1 = __importDefault(require("../../shared/services/redis.service"));
const twilio_service_1 = require("../../shared/services/twilio.service");
const resend_service_1 = require("../../shared/services/resend.service");
const auth_utils_1 = require("../authentication/auth.utils");
const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
class OtpService {
    encryptionService = new encryption_service_1.default();
    twilioService = new twilio_service_1.TwilioService();
    resendService = new resend_service_1.ResendService();
    async createOtp(identifier) {
        const existingOtp = await connect_1.default.otp.findFirst({
            where: {
                identifier,
                status: app_constants_1.STATUS.PENDING,
                expiresAt: { gt: new Date() },
            },
        });
        if (existingOtp) {
            const cachedToken = await redis_service_1.default.instance.get(existingOtp.token);
            if (cachedToken) {
                await this.deliver(identifier, cachedToken);
                return cachedToken;
            }
            // Cache miss — fall through and issue a fresh OTP
            await connect_1.default.otp.delete({ where: { id: existingOtp.id } });
        }
        const token = helper_1.Helper.generateRandomString(6, app_constants_1.RANDOM_STRING_TYPE.NUM);
        const hashedToken = await this.encryptionService.hashString(token);
        await redis_service_1.default.instance.set(hashedToken, token, OTP_TTL_SECONDS);
        await connect_1.default.otp.create({
            data: {
                identifier,
                status: app_constants_1.STATUS.PENDING,
                token: hashedToken,
                expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
            },
        });
        await this.deliver(identifier, token);
        return token;
    }
    async verifyOtp(identifier, token) {
        const hashedToken = await this.encryptionService.hashString(token);
        const otp = await connect_1.default.otp.findFirst({
            where: {
                identifier,
                token: hashedToken,
                status: app_constants_1.STATUS.PENDING,
                expiresAt: { gt: new Date() },
            },
        });
        if (!otp)
            return null;
        return connect_1.default.otp.update({
            where: { id: otp.id },
            data: { status: app_constants_1.STATUS.VERIFIED },
            select: { id: true, createdAt: true },
        });
    }
    async resendOtp(identifier) {
        return this.createOtp(identifier);
    }
    async getOtp(id) {
        return connect_1.default.otp.findFirst({ where: { id } });
    }
    async deleteOtp(id) {
        return connect_1.default.otp.delete({ where: { id } });
    }
    async deleteUserOtp(identifier) {
        const existing = await connect_1.default.otp.findFirst({
            where: { identifier, status: app_constants_1.STATUS.PENDING, expiresAt: { gt: new Date() } },
        });
        if (!existing)
            return null;
        return connect_1.default.otp.deleteMany({ where: { identifier } });
    }
    async deliver(identifier, token) {
        const { type, value } = (0, auth_utils_1.sanitizeIdentifier)(identifier);
        if (type === "email") {
            await this.resendService.sendEmail(value, resend_service_1.Template.OTP, { otp: token });
            return;
        }
        await this.twilioService.sendOTP(value, token);
    }
}
exports.OtpService = OtpService;
