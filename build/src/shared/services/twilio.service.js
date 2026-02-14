"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const app_config_1 = __importDefault(require("../config/app.config"));
class TwilioService {
    client;
    constructor() {
        this.client = (0, twilio_1.default)(app_config_1.default.TWILIO.accountSid, app_config_1.default.TWILIO.authToken);
    }
    async sendSMS(to, message) {
        try {
            const data = await this.client.messages.create({
                body: message,
                to,
                from: app_config_1.default.TWILIO.phoneNumber,
            });
            return data;
        }
        catch (error) {
            return new Error(`Twilio SMS error ${error}`);
        }
    }
    async sendOTP(phoneNumber, otp) {
        const message = `Your verification code is: ${otp}`;
        return this.sendSMS(phoneNumber, message);
    }
}
exports.TwilioService = TwilioService;
