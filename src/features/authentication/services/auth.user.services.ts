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

export const { GOOGLE } = config;

export class AuthUserService {
  constructor() { }

  private readonly otpService = new OtpService();
  private readonly encryptionService = new EncryptionService();
  private readonly tokenService = new TokenService();

  // Google OAuth client
  private readonly googleClient = new OAuth2Client({
    clientId: GOOGLE.CLIENT_ID,
    clientSecret: GOOGLE.CLIENT_SECRET,
  });

  public async register(data: IRegistration) {
    try {
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

      // Check for existing verified user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (existingUser) {
        throw new Error("This email is already registered");
      }


      if (existingUser?.status === Status.DELETED) {
        throw Error("Your account has been deleted. Please contact support if you believe this is an error.");
      }


      if (password !== confirmPassword) {
        throw new Error("Password and confirm password do not match");
      }

      // check the tokenn
      const verifiedOtp = await this.otpService.getOtp(token_id);

      if (!verifiedOtp) {
        throw new Error("Invalid OTP");
      }

      if (verifiedOtp.expiresAt < new Date()) {
        throw new Error("OTP expired");
      }

      if (verifiedOtp.status !== STATUS.VERIFIED) {
        throw new Error("Invalid OTP");
      }

      const hashedPassword = await this.encryptionService.hashPassword(
        password
      );

      const newUser = await prisma.user.create({
        data: {
          email,
          firstName: firstName,
          lastName: lastName,
          password: hashedPassword,
          isEmailVerified: true,
          address: address,
          phone: phone,
          cityOfResidence: cityOfResidence,
          isPhoneVerified: false,
          status: STATUS.COMPLETED,
          latitude: latitude,
          longitude: longitude,
          locationAccuracy: LocationAccuracy.EXACT,
        },
      });

      await this.otpService.deleteOtp(token_id);

      const token = await this.generateToken(
        newUser.id,
        `${newUser.firstName} ${newUser.lastName}`
      );

      return { user: newUser, token: token };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`User registration failed: ${error.message}`);
      }
      throw new Error("An unexpected error occurred during registration");
    }
  }

  public async checkUser(identifier: string) {
    const email = identifier.trim().toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      throw new Error("Email already in use");
    }

    const otp = await this.otpService.createOtp(email);
    return otp;
  }

  public async verifyOtp(identifier: string, otp: string) {
    const identifierData = sanitizeIdentifier(identifier);
    const verifiedOtp = await this.otpService.verifyOtp(
      identifierData.value,
      otp
    );
    if (!verifiedOtp) {
      throw new Error("Invalid OTP");
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
      throw Error("Please check email and password");
    }

    if (user?.status === Status.DELETED) {
      throw Error("Your account has been deleted. Please contact support if you believe this is an error.");
    }


    if (user.authType === AuthType.GOOGLE) {
      throw Error("Please login with Google");
    }


    const isPasswordValid = await this.encryptionService.comparePassword(
      user.password,
      password
    );

    if (!isPasswordValid) {
      throw Error("Invalid password");
    }

    return {
      status: 200,
      message: "Login successful",
      user,
    };
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
      throw Error("The new password and confirmation password do not match");
    }

    const _user = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const isPasswordValid = await this.encryptionService.comparePassword(
      _user?.password,
      oldPassword
    );

    if (!isPasswordValid) {
      throw Error("Invalid old password");
    }

    const hashedPassword = await this.encryptionService.hashPassword(password);

    if (hashedPassword == oldPassword)
      throw Error("New password can not be same as existing password");

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return updatedUser;
  }

  public async googleAuth(data: { token: string }) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: data.token,
      audience: GOOGLE.CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();

    if (!googlePayload) {
      throw Error("Invalid Google token");
    }
    console.log(googlePayload);

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

      return {
        isNewUser: true,
        user: _user,
        token: _token,
      };
    }

    const _token = await this.generateToken(
      _user.id,
      `${_user.firstName} ${_user.lastName}`
    );

    return {
      isNewUser: _user.cityOfResidence ? false : true,
      user: _user,
      token: _token,
    };
  }

  // Reset password
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
      throw Error("Email not found or not registered");
    }

    if (user.status === Status.DELETED) {
      throw Error("Your account has been deleted. Please contact support if you believe this is an error.");
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
      throw Error("Email not found or not registered");
    }

    const verifiedOtp = await this.otpService.verifyOtp(
      identifierData.value,
      otp
    );

    if (!verifiedOtp) {
      throw Error("Invalid OTP");
    }

    return verifiedOtp;
  }

  public async resetPasswordUpdate(
    password: string,
    passwordConfirmation: string,
    token: string
  ) {
    const verifiedOtp = await this.otpService.getOtp(token);
    const identifierData = sanitizeIdentifier(verifiedOtp.identifier);
    const user = await prisma.user.findFirst({
      where: { [identifierData.type]: identifierData.value },
    });

    if (!user) {
      throw Error("Email not found or not registered");
    }

    if (password !== passwordConfirmation) {
      throw Error("The new password and confirmation password do not match");
    }

    if (!verifiedOtp) {
      throw Error("Invalid OTP");
    }

    const hashedPassword = await this.encryptionService.hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await this.otpService.deleteOtp(token);
    return updatedUser;
  }
}
