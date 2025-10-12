import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { RANDOM_STRING_TYPE, STATUS } from "../../shared/config/app.constants";
import EncryptionService from "../../shared/services/encryption.service";
import { Helper } from "../../shared/helper/helper";
import RedisService from "../../shared/services/redis.service";
import { TwilioService } from "../../shared/services/twilio.service";
import { ResendService, Template } from "../../shared/services/resend.service";

export class OtpService {
  private readonly encryptionService = new EncryptionService();
  private readonly twilioService = new TwilioService();
  private readonly resendService = new ResendService();

  public async createOtp(identifier: string): Promise<string | null> {
    // generate otp code
    let token_sent = null;
    const token = Helper.generateRandomString(6, RANDOM_STRING_TYPE.NUM);
    const hashedToken = await this.encryptionService.hashString(token);

    /// check if user has a code that is unused and has not expired
    const existingOtp = await prismaClient.otp.findFirst({
      where: {
        identifier,
        status: STATUS.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingOtp) {
      // Decode the token
      const oldToken = await RedisService.instance.get(existingOtp.token);
      token_sent = oldToken;
      console.log(`Your OTP is ${oldToken}`);
      await this.twilioService.sendOTP(identifier, oldToken);
      await this.resendService.sendEmail(identifier, Template.OTP, { otp: oldToken });
      return token_sent;
    }

    RedisService.instance.set(hashedToken, token, 1000 * 60 * 5);
    console.log(`Your OTP is ${token}`);
    token_sent = token;
    await prismaClient.otp.create({
      data: {
        identifier,
        status: STATUS.PENDING,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 5),
      },
    });

    await this.twilioService.sendOTP(identifier, token);
    await this.resendService.sendEmail(identifier, Template.OTP, { otp: token });

    return token_sent;
  }

  public async verifyOtp(identifier: string, token: string): Promise<any> {
    const hashedToken = await this.encryptionService.hashString(token);
    const otp = await prismaClient.otp.findFirst({
      where: {
        identifier,
        token: hashedToken,
        status: STATUS.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      return null;
    }

    const updatedOtp = await prismaClient.otp.update({
      where: { id: otp.id },
      data: { status: STATUS.VERIFIED },
      select: {
        id: true,
        createdAt: true,
      },
    });
    return updatedOtp;
  }

  public async resendOtp(identifier: string) {
    const otp = await this.createOtp(identifier);
    return otp;
  }

  public async getOtp(id: string) {
    const otp = await prismaClient.otp.findFirst({
      where: { id },
    });
    return otp;
  }

  public async deleteOtp(id: string) {
    const otp = await prismaClient.otp.delete({
      where: { id },
    });
    return otp;
  }

  public async deleteUserOtp(identifier: string) {
    // Check if user has any active OTP to delete
    const existingOtp = await prismaClient.otp.findFirst({
      where: { 
        identifier,
        status: STATUS.PENDING,
        expiresAt: { gt: new Date() }
      },
    });

    if (!existingOtp) {
      return null;
    }

    const otp = await prismaClient.otp.deleteMany({
      where: { identifier },
    });
    return otp;
  }
}
