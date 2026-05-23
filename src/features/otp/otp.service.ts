import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { RANDOM_STRING_TYPE, STATUS } from "../../shared/config/app.constants";
import EncryptionService from "../../shared/services/encryption.service";
import { Helper } from "../../shared/helper/helper";
import RedisService from "../../shared/services/redis.service";
import { TwilioService } from "../../shared/services/twilio.service";
import { ResendService, Template } from "../../shared/services/resend.service";

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes

export class OtpService {
  private readonly encryptionService = new EncryptionService();
  private readonly twilioService = new TwilioService();
  private readonly resendService = new ResendService();

  public async createOtp(identifier: string): Promise<string> {
    const existingOtp = await prismaClient.otp.findFirst({
      where: {
        identifier,
        status: STATUS.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingOtp) {
      const cachedToken = await RedisService.instance.get(existingOtp.token);
      if (cachedToken) {
        await this.deliver(identifier, cachedToken);
        return cachedToken;
      }
      // Cache miss — fall through and issue a fresh OTP
      await prismaClient.otp.delete({ where: { id: existingOtp.id } });
    }

    const token = Helper.generateRandomString(6, RANDOM_STRING_TYPE.NUM);
    const hashedToken = await this.encryptionService.hashString(token);

    await RedisService.instance.set(hashedToken, token, OTP_TTL_SECONDS);

    await prismaClient.otp.create({
      data: {
        identifier,
        status: STATUS.PENDING,
        token: hashedToken,
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      },
    });

    await this.deliver(identifier, token);
    return token;
  }

  public async verifyOtp(identifier: string, token: string) {
    const hashedToken = await this.encryptionService.hashString(token);

    const otp = await prismaClient.otp.findFirst({
      where: {
        identifier,
        token: hashedToken,
        status: STATUS.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) return null;

    return prismaClient.otp.update({
      where: { id: otp.id },
      data: { status: STATUS.VERIFIED },
      select: { id: true, createdAt: true },
    });
  }

  public async resendOtp(identifier: string) {
    return this.createOtp(identifier);
  }

  public async getOtp(id: string) {
    return prismaClient.otp.findFirst({ where: { id } });
  }

  public async deleteOtp(id: string) {
    return prismaClient.otp.delete({ where: { id } });
  }

  public async deleteUserOtp(identifier: string) {
    const existing = await prismaClient.otp.findFirst({
      where: { identifier, status: STATUS.PENDING, expiresAt: { gt: new Date() } },
    });

    if (!existing) return null;

    return prismaClient.otp.deleteMany({ where: { identifier } });
  }

  private async deliver(identifier: string, token: string): Promise<void> {
    await Promise.allSettled([
      this.twilioService.sendOTP(identifier, token),
      this.resendService.sendEmail(identifier, Template.OTP, { otp: token }),
    ]);
  }
}
