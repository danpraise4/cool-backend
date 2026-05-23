import httpStatus from "http-status";
import { AuthUserService } from "../services/auth.user.services";
import { NextFunction, Request, Response } from "express";
import { RequestType } from "../../../shared/helper/helper";
import LocationService from "../../../shared/services/location.service";
import { UserService } from "../../user/user.services";
import { sendSuccess } from "../../../shared/helper/response";

export default class AuthUserController {
  constructor(
    readonly authService: AuthUserService,
    readonly locationService: LocationService,
    readonly userService: UserService
  ) {}

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { user } = await this.authService.login(email, password);
      const token = await this.authService.generateToken(
        user.id,
        `${user.firstName} ${user.lastName}`
      );
      delete (user as { password?: string }).password;
      sendSuccess(res, httpStatus.OK, {
        message: "Login successful",
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.register(req.body);
      delete (data.user as { password?: string }).password;
      sendSuccess(res, httpStatus.CREATED, {
        message: "Registration successful",
        data: { user: data.user, token: data.token },
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, otp } = req.body;
      const data = await this.authService.verifyOtp(identifier, otp);
      sendSuccess(res, httpStatus.OK, {
        message: "OTP verified successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public checkUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier } = req.body;
      await this.authService.checkUser(identifier);
      sendSuccess(res, httpStatus.OK, {
        message: "Email is available",
        data: { email_available: true },
      });
    } catch (error) {
      next(error);
    }
  };

  public resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier } = req.body;
      await this.authService.resendOtp(identifier);
      sendSuccess(res, httpStatus.OK, { message: "OTP resent successfully" });
    } catch (error) {
      next(error);
    }
  };

  public updatePassword = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { oldPassword, password, passwordConfirmation } = req.body;
      await this.authService.updatePassword(
        req.user,
        password,
        passwordConfirmation,
        oldPassword
      );
      sendSuccess(res, httpStatus.OK, { message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  public googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.googleAuth(req.body);
      delete (data.user as { password?: string }).password;
      sendSuccess(res, httpStatus.OK, {
        message: "Google authentication successful",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public getLocation = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { lat, long } = req.query;
      const location = await this.locationService.getCititiesfromLatLong({
        lat: Number(lat),
        long: Number(long),
      });
      sendSuccess(res, httpStatus.OK, {
        message: "Location fetched successfully",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      await this.authService.resetPassword(email);
      sendSuccess(res, httpStatus.OK, {
        message: "Password reset OTP sent to your email",
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, otp } = req.body;
      const data = await this.authService.verifyResetPassword(email, otp);
      sendSuccess(res, httpStatus.OK, {
        message: "OTP verified successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPasswordUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { password, passwordConfirmation, token } = req.body;
      await this.authService.resetPasswordUpdate(
        password,
        passwordConfirmation,
        token
      );
      sendSuccess(res, httpStatus.OK, { message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: RequestType, res: Response, next: NextFunction) => {
    try {
      await this.authService.logout(req.user.id);
      sendSuccess(res, httpStatus.OK, { message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  };
}
