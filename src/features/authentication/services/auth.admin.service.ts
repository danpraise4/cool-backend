import { User } from "@prisma/client";
import prisma from "../../../infastructure/database/postgreSQL/connect";
import { STATUS } from "../../../shared/config/app.constants";
import EncryptionService from "../../../shared/services/encryption.service";
import TokenService from "../../../shared/services/token.service";
import { OtpService } from "../../otp/otp.service";
import { IRegistration } from "../interfaces/auth.interface";
import config from "../../../shared/config/app.config";
import { sanitizeIdentifier } from "../auth.utils";

export const { GOOGLE } = config;

export class AuthAdminService {
  constructor() {}

  private readonly otpService = new OtpService();
  private readonly encryptionService = new EncryptionService();
  private readonly tokenService = new TokenService();

  public async register(indentifer: string) {
    try {
      const identifierData = sanitizeIdentifier(indentifer);

      // Check for existing verified user
      const existingUser = await prisma.admin.findFirst({
        where: {
          [identifierData.type]: identifierData.value,
          status: STATUS.VERIFIED,
        },
      });

      if (existingUser) {
        throw new Error("This phone number is already registered");
      }

      // Check for unverified user
      const unverifiedUser = await prisma.admin.findFirst({
        where: {
          [identifierData.type]: identifierData.value,
          status: STATUS.PENDING,
        },
      });

      if (unverifiedUser) {
        const token_sent = await this.otpService.createOtp(
          identifierData.value
        );
        return { user: unverifiedUser, token: token_sent };
      }

      // Create new user
      const newUser = await prisma.admin.create({
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

      const token_sent = await this.otpService.createOtp(identifierData.value);
      return { user: newUser, token: token_sent };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`User registration failed: ${error.message}`);
      }
      throw new Error("An unexpected error occurred during registration");
    }
  }

  public async verifyOtp(identifier: string, otp: string) {
    const identifierData = sanitizeIdentifier(identifier);
    console.log(identifierData);

    const user = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw new Error("Admin not found");
    }

    const verifiedOtp = await this.otpService.verifyOtp(
      identifierData.value,
      otp
    );
    if (!verifiedOtp) {
      throw new Error("Invalid OTP");
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id: user.id },
      data: {
        status: STATUS.VERIFIED,
        isEmailVerified: true,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return { admin: updatedAdmin, otp: verifiedOtp };
  }

  public async completeRegistration(data: IRegistration) {
    // check if otp is valid
    const otp = await this.otpService.getOtp(data.token);
    if (!otp) {
      throw Error("Invalid OTP");
    }

    // check if user exists
    const identifierData = sanitizeIdentifier(otp.identifier);
    const user = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw Error("User not found");
    }

    console.log(user);
    console.log(identifierData);

    // check if email is already in use
    const emailUser = await prisma.admin.findFirst({
      where: {
        [identifierData.type]: identifierData.value,
        password: { not: null },
      },
    });

    if (emailUser) {
      throw Error("Email already in use");
    }

    // hash password
    const hashedPassword = await this.encryptionService.hashPassword(
      data.password.trim()
    );

    // create user
    const newUser = await prisma.admin.update({
      where: { id: user.id },
      data: {
        [identifierData.type]: identifierData.value,

        firstName: data.firstName,
        password: hashedPassword,
        status: STATUS.COMPLETED,
        lastName: data.lastName,
      },
    });

    await this.otpService.deleteOtp(otp.id);
    return newUser;
  }

  public async login(identifier: string, password: string) {
    const identifierData = sanitizeIdentifier(identifier);

    const user = await prisma.admin.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw Error("User not found");
    }

    if (user.status !== STATUS.COMPLETED || user.password === null) {
      throw Error("User not completed registration");
    }

    console.log(
      `hashedPassword: ${password} :  userPassword: ${user.password}`
    );

    const isPasswordValid = await this.encryptionService.comparePassword(
      user.password,
      password
    );

    if (!isPasswordValid) {
      throw Error("Invalid password");
    }

    return user;
  }

  public async generateToken(id: string, name: string) {
    const token = await this.tokenService.generateToken(id, name);
    return token;
  }

  public async logout(id: string) {
    await this.tokenService.deleteToken(id);
  }

  public async updatePassword(
    user: User,
    password: string,
    passwordConfirmation: string,
    oldPassword: string
  ) {
    if (password !== passwordConfirmation) {
      throw Error("Password and password confirmation do not match");
    }

    const isPasswordValid = await this.encryptionService.comparePassword(
      oldPassword,
      user.password || ""
    );

    if (!isPasswordValid) {
      throw Error("Invalid old password");
    }

    const hashedPassword = await this.encryptionService.hashPassword(password);
    const updatedUser = await prisma.admin.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });
    return updatedUser;
  }
}
