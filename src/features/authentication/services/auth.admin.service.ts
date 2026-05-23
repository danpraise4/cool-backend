import prisma from "../../../infastructure/database/postgreSQL/connect";
import { STATUS } from "../../../shared/config/app.constants";
import EncryptionService from "../../../shared/services/encryption.service";
import TokenService from "../../../shared/services/token.service";
import { OtpService } from "../../otp/otp.service";
import { IRegistration } from "../interfaces/auth.interface";
import { sanitizeIdentifier } from "../auth.utils";
import AppException from "../../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";

export class AuthAdminService {
  private readonly otpService = new OtpService();
  private readonly encryptionService = new EncryptionService();
  private readonly tokenService = new TokenService();

  public async register(identifier: string) {
    const identifierData = sanitizeIdentifier(identifier);

    const verifiedAdmin = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value, status: STATUS.VERIFIED },
    });

    if (verifiedAdmin) {
      throw new AppException("This account is already registered", httpStatus.CONFLICT);
    }

    const pendingAdmin = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value, status: STATUS.PENDING },
    });

    if (pendingAdmin) {
      const token = await this.otpService.createOtp(identifierData.value);
      return { user: pendingAdmin, token };
    }

    const newAdmin = await prisma.admin.create({
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

  public async verifyOtp(identifier: string, otp: string) {
    const identifierData = sanitizeIdentifier(identifier);

    const admin = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!admin) {
      throw new AppException("Admin not found", httpStatus.NOT_FOUND);
    }

    const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);

    if (!verifiedOtp) {
      throw new AppException("Invalid OTP", httpStatus.BAD_REQUEST);
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: { status: STATUS.VERIFIED, isEmailVerified: true },
      select: { id: true, email: true, createdAt: true },
    });

    return { admin: updatedAdmin, otp: verifiedOtp };
  }

  public async completeRegistration(data: IRegistration) {
    const otp = await this.otpService.getOtp(data.token);

    if (!otp) {
      throw new AppException("Invalid or expired token", httpStatus.BAD_REQUEST);
    }

    const identifierData = sanitizeIdentifier(otp.identifier);

    const admin = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!admin) {
      throw new AppException("Admin not found", httpStatus.NOT_FOUND);
    }

    const alreadyComplete = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value, password: { not: null } },
    });

    if (alreadyComplete) {
      throw new AppException("Registration already completed", httpStatus.CONFLICT);
    }

    const hashedPassword = await this.encryptionService.hashPassword(data.password.trim());

    const updatedAdmin = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        [identifierData.type]: identifierData.value,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        status: STATUS.COMPLETED,
      },
    });

    await this.otpService.deleteOtp(otp.id);
    return updatedAdmin;
  }

  public async login(identifier: string, password: string) {
    const identifierData = sanitizeIdentifier(identifier);

    const admin = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!admin) {
      throw new AppException("Invalid credentials", httpStatus.UNAUTHORIZED);
    }

    if (admin.status !== STATUS.COMPLETED || !admin.password) {
      throw new AppException(
        "Registration not complete. Please finish setting up your account.",
        httpStatus.FORBIDDEN
      );
    }

    const isPasswordValid = await this.encryptionService.comparePassword(
      admin.password,
      password
    );

    if (!isPasswordValid) {
      throw new AppException("Invalid credentials", httpStatus.UNAUTHORIZED);
    }

    return admin;
  }

  public async generateToken(id: string, name: string) {
    return this.tokenService.generateToken(id, name);
  }

  public async logout(id: string) {
    await this.tokenService.deleteToken(id);
  }

  public async updatePassword(
    adminId: string,
    newPassword: string,
    passwordConfirmation: string,
    oldPassword: string
  ) {
    if (newPassword !== passwordConfirmation) {
      throw new AppException(
        "New password and confirmation do not match",
        httpStatus.BAD_REQUEST
      );
    }

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });

    if (!admin || !admin.password) {
      throw new AppException("Admin not found", httpStatus.NOT_FOUND);
    }

    const isOldPasswordValid = await this.encryptionService.comparePassword(
      admin.password,
      oldPassword
    );

    if (!isOldPasswordValid) {
      throw new AppException("Current password is incorrect", httpStatus.BAD_REQUEST);
    }

    const isSamePassword = await this.encryptionService.comparePassword(
      admin.password,
      newPassword
    );

    if (isSamePassword) {
      throw new AppException(
        "New password cannot be the same as current password",
        httpStatus.BAD_REQUEST
      );
    }

    const hashedPassword = await this.encryptionService.hashPassword(newPassword);

    return prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });
  }
}
