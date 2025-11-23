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
class OtpService {
    encryptionService = new encryption_service_1.default();
    twilioService = new twilio_service_1.TwilioService();
    resendService = new resend_service_1.ResendService();
    async createOtp(identifier) {
        // generate otp code
        let token_sent = null;
        const token = helper_1.Helper.generateRandomString(6, app_constants_1.RANDOM_STRING_TYPE.NUM);
        const hashedToken = await this.encryptionService.hashString(token);
        /// check if user has a code that is unused and has not expired
        const existingOtp = await connect_1.default.otp.findFirst({
            where: {
                identifier,
                status: app_constants_1.STATUS.PENDING,
                expiresAt: { gt: new Date() },
            },
        });
        if (existingOtp) {
            // Decode the token
            const oldToken = await redis_service_1.default.instance.get(existingOtp.token);
            token_sent = oldToken;
            console.log(`Your OTP is ${oldToken}`);
            await this.twilioService.sendOTP(identifier, oldToken);
            await this.resendService.sendEmail(identifier, resend_service_1.Template.OTP, { otp: oldToken });
            return token_sent;
        }
        redis_service_1.default.instance.set(hashedToken, token, 1000 * 60 * 5);
        console.log(`Your OTP is ${token}`);
        token_sent = token;
        await connect_1.default.otp.create({
            data: {
                identifier,
                status: app_constants_1.STATUS.PENDING,
                token: hashedToken,
                expiresAt: new Date(Date.now() + 1000 * 60 * 5),
            },
        });
        await this.twilioService.sendOTP(identifier, token);
        await this.resendService.sendEmail(identifier, resend_service_1.Template.OTP, { otp: token });
        return token_sent;
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
        if (!otp) {
            return null;
        }
        const updatedOtp = await connect_1.default.otp.update({
            where: { id: otp.id },
            data: { status: app_constants_1.STATUS.VERIFIED },
            select: {
                id: true,
                createdAt: true,
            },
        });
        return updatedOtp;
    }
    async resendOtp(identifier) {
        const otp = await this.createOtp(identifier);
        return otp;
    }
    async getOtp(id) {
        const otp = await connect_1.default.otp.findFirst({
            where: { id },
        });
        return otp;
    }
    async deleteOtp(id) {
        const otp = await connect_1.default.otp.delete({
            where: { id },
        });
        return otp;
    }
    async deleteUserOtp(identifier) {
        // Check if user has any active OTP to delete
        const existingOtp = await connect_1.default.otp.findFirst({
            where: {
                identifier,
                status: app_constants_1.STATUS.PENDING,
                expiresAt: { gt: new Date() }
            },
        });
        if (!existingOtp) {
            return null;
        }
        const otp = await connect_1.default.otp.deleteMany({
            where: { identifier },
        });
        return otp;
    }
}
exports.OtpService = OtpService;
