import twilio, { Twilio } from "twilio";
import config from "../config/app.config";

export class TwilioService {
  private client: Twilio;

  constructor() {
    this.client = twilio(config.TWILIO.accountSid, config.TWILIO.authToken);
  }

  async sendSMS(to: string, message: string) {
    try {
      const data = await this.client.messages.create({
        body: message,
        to,
        from: config.TWILIO.phoneNumber,
      });
      return data;
    } catch (error) {
      return new Error(`Twilio SMS error ${error}`);
    }
  }

  async sendOTP(phoneNumber: string, otp: string) {
    const message = `Your verification code is: ${otp}`;
    return this.sendSMS(phoneNumber, message);
  }
}
