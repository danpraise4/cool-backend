import { AuthType, LocationAccuracy, Status, User } from "@prisma/client";
import prisma from "../../../infastructure/database/postgreSQL/connect";
import { STATUS } from "../../../shared/config/app.constants";
import EncryptionService from "../../../shared/services/encryption.service";
import TokenService from "../../../shared/services/token.service";
import { OtpService } from "../../otp/otp.service";
import { IRegistration } from "../interfaces/auth.interface";
import { OAuth2Client } from "google-auth-library";
import config from "../../../shared/config/app.config";
import { sanitizeIdentifier } from "../auth.utils";
import AppException from "../../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";

export const { GOOGLE } = config;

export class AuthUserService {
  private readonly otpService = new OtpService();
  private readonly encryptionService = new EncryptionService();
  private readonly tokenService = new TokenService();

  private readonly googleClient = new OAuth2Client({
    clientId: GOOGLE.CLIENT_ID,
    clientSecret: GOOGLE.CLIENT_SECRET,
  });

  public async register(data: IRegistration) {
    const {
      identifier,
      firstName,
      lastName,
      password,
      confirmPassword,
      phone,
      address,
      cityOfResidence,
      latitude,
      longitude,
      token: token_id,
    } = data;
    const email = identifier.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({ where: { email } });

    if (existingUser?.status === Status.DELETED) {
      throw new AppException(
        "Your account has been deleted. Please contact support.",
        httpStatus.FORBIDDEN
      );
    }

    if (existingUser) {
      throw new AppException("This email is already registered", httpStatus.CONFLICT);
    }

    if (password !== confirmPassword) {
      throw new AppException(
        "Password and confirm password do not match",
        httpStatus.BAD_REQUEST
      );
    }

    const verifiedOtp = await this.otpService.getOtp(token_id);

    if (!verifiedOtp || verifiedOtp.expiresAt < new Date()) {
      throw new AppException("OTP has expired", httpStatus.BAD_REQUEST);
    }

    if (verifiedOtp.status !== STATUS.VERIFIED) {
      throw new AppException("OTP not verified", httpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.encryptionService.hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashedPassword,
        isEmailVerified: true,
        address,
        phone,
        cityOfResidence,
        isPhoneVerified: false,
        status: STATUS.COMPLETED,
        latitude,
        longitude,
        locationAccuracy: LocationAccuracy.EXACT,
      },
    });

    await this.otpService.deleteOtp(token_id);

    const token = await this.generateToken(
      newUser.id,
      `${newUser.firstName} ${newUser.lastName}`
    );

    return { user: newUser, token };
  }

  public async checkUser(identifier: string) {
    const email = identifier.trim().toLowerCase();
    const user = await prisma.user.findFirst({ where: { email } });

    if (user) {
      throw new AppException("Email already in use", httpStatus.CONFLICT);
    }

    const otp = await this.otpService.createOtp(email);
    return otp;
  }

  public async verifyOtp(identifier: string, otp: string) {
    const identifierData = sanitizeIdentifier(identifier);
    const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);

    if (!verifiedOtp) {
      throw new AppException("Invalid OTP", httpStatus.BAD_REQUEST);
    }

    return { otp: verifiedOtp };
  }

  public async resendOtp(identifier: string) {
    const identifierData = sanitizeIdentifier(identifier);
    await this.otpService.deleteUserOtp(identifierData.value);
    const token_sent = await this.otpService.createOtp(identifierData.value);
    return { token: token_sent };
  }

  public async login(identifier: string, password: string) {
    const identifierData = sanitizeIdentifier(identifier);

    const user = await prisma.user.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw new AppException("Invalid email or password", httpStatus.UNAUTHORIZED);
    }

    if (user.status === Status.DELETED) {
      throw new AppException(
        "Your account has been deleted. Please contact support.",
        httpStatus.FORBIDDEN
      );
    }

    if (user.authType === AuthType.GOOGLE) {
      throw new AppException("Please sign in with Google", httpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await this.encryptionService.comparePassword(
      user.password,
      password
    );

    if (!isPasswordValid) {
      throw new AppException("Invalid email or password", httpStatus.UNAUTHORIZED);
    }

    return { user };
  }

  public async generateToken(id: string, name: string) {
    return this.tokenService.generateToken(id, name);
  }

  public async logout(id: string) {
    await this.tokenService.deleteToken(id);
  }

  public async updatePassword(
    user: User,
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

    const _user = await prisma.user.findUnique({ where: { id: user.id } });

    if (!_user) {
      throw new AppException("User not found", httpStatus.NOT_FOUND);
    }

    const isOldPasswordValid = await this.encryptionService.comparePassword(
      _user.password,
      oldPassword
    );

    if (!isOldPasswordValid) {
      throw new AppException("Current password is incorrect", httpStatus.BAD_REQUEST);
    }

    const isSamePassword = await this.encryptionService.comparePassword(
      _user.password,
      newPassword
    );

    if (isSamePassword) {
      throw new AppException(
        "New password cannot be the same as current password",
        httpStatus.BAD_REQUEST
      );
    }

    const hashedPassword = await this.encryptionService.hashPassword(newPassword);

    return prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }

  public async googleAuth(data: { token: string }) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: data.token,
      audience: GOOGLE.CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();

    if (!googlePayload) {
      throw new AppException("Invalid Google token", httpStatus.UNAUTHORIZED);
    }

    let _user = await prisma.user.findFirst({
      where: { email: googlePayload.email },
    });

    if (!_user) {
      _user = await prisma.user.create({
        data: {
          email: googlePayload.email,
          firstName: googlePayload.given_name,
          lastName: googlePayload.family_name,
          status: STATUS.VERIFIED,
          image: googlePayload.picture,
          isEmailVerified: true,
          authType: AuthType.GOOGLE,
        },
      });

      const _token = await this.generateToken(
        _user.id,
        `${_user.firstName} ${_user.lastName}`
      );

      return { isNewUser: true, user: _user, token: _token };
    }

    const _token = await this.generateToken(
      _user.id,
      `${_user.firstName} ${_user.lastName}`
    );

    return {
      isNewUser: !_user.cityOfResidence,
      user: _user,
      token: _token,
    };
  }

  public async resetPassword(email: string) {
    const identifierData = sanitizeIdentifier(email);
    const user = await prisma.user.findFirst({
      where: { [identifierData.type]: identifierData.value },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        status: true,
      },
    });

    if (!user) {
      throw new AppException("Email not found", httpStatus.NOT_FOUND);
    }

    if (user.status === Status.DELETED) {
      throw new AppException(
        "Your account has been deleted. Please contact support.",
        httpStatus.FORBIDDEN
      );
    }

    await this.otpService.createOtp(identifierData.value);

    return { ...user };
  }

  public async verifyResetPassword(email: string, otp: string) {
    const identifierData = sanitizeIdentifier(email);
    const user = await prisma.user.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw new AppException("Email not found", httpStatus.NOT_FOUND);
    }

    const verifiedOtp = await this.otpService.verifyOtp(identifierData.value, otp);

    if (!verifiedOtp) {
      throw new AppException("Invalid OTP", httpStatus.BAD_REQUEST);
    }

    return verifiedOtp;
  }

  public async resetPasswordUpdate(
    password: string,
    passwordConfirmation: string,
    token: string
  ) {
    const verifiedOtp = await this.otpService.getOtp(token);

    if (!verifiedOtp) {
      throw new AppException("Invalid or expired token", httpStatus.BAD_REQUEST);
    }

    const identifierData = sanitizeIdentifier(verifiedOtp.identifier);
    const user = await prisma.user.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw new AppException("User not found", httpStatus.NOT_FOUND);
    }

    if (password !== passwordConfirmation) {
      throw new AppException(
        "Password and confirmation do not match",
        httpStatus.BAD_REQUEST
      );
    }

    const hashedPassword = await this.encryptionService.hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.otpService.deleteOtp(token);
    return updatedUser;
  }
}
