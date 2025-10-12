import httpStatus from "http-status";
import AppException from "../../../infastructure/https/exception/app.exception";
import { AuthUserService } from "../services/auth.user.services";
import { NextFunction, Request, Response } from "express";
import { RequestType } from "../../../shared/helper/helper";
import LocationService from "../../../shared/services/location.service";
import { UserService } from "../../user/user.services";

export default class AuthUserController {
  constructor(
    readonly authService: AuthUserService,
    readonly locationService: LocationService,
    readonly userService: UserService
  ) {}

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login(email, password);

      // generate token
      if (result.status === 200) {
        const token = await this.authService.generateToken(
          result.user.id,
          `${result.user.firstName} ${result.user.lastName}`
        );

        res.status(httpStatus.OK).json({
          message: "Login successful",
          data: {
            user: result.user,
            token,
          },
        });
      } else {
        return res.status(result.status).json(result);
      }
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.authService.register(req.body);

      res.status(httpStatus.OK).json({
        message: `Register successful. For testing purposes, your OTP is ${data.token}`,
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { identifier, otp } = req.body;
      const data = await this.authService.verifyOtp(identifier, otp);

      res.status(httpStatus.OK).json({
        message: "OTP verified successfully",
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public checkUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { identifier } = req.body;
      const data = await this.authService.checkUser(identifier);
      res.status(httpStatus.OK).json({
        message: `User checked successfully. For testing purposes, your OTP is ${data}`,
        status: "success",
        data: {
          email_available: true,
        },
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public resendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { identifier } = req.body;
      const data = await this.authService.resendOtp(identifier);

      res.status(httpStatus.OK).json({
        message: "OTP resent successfully",
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public updatePassword = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { oldPassword, password, passwordConfirmation } = req.body;
      const user = req.user;
      const updatedUser = await this.authService.updatePassword(
        user,
        password,
        passwordConfirmation,
        oldPassword
      );

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Password updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Google Auth
  public googleAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.authService.googleAuth(req.body);
      res.status(httpStatus.OK).json({
        message: "Google auth successful",
        status: "success",
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
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
      res.status(httpStatus.OK).json({
        message: "Location fetched successfully",
        data: location,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  // Reset password
  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = req.body;
      const data = await this.authService.resetPassword(email);
      res.status(httpStatus.OK).json({
        message: "Password reset successful",
        status: "success",
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  verifyResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email, otp } = req.body;
      const data = await this.authService.verifyResetPassword(email, otp);
      res.status(httpStatus.OK).json({
        message: "Password reset successful",
        status: "success",
        data,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public resetPasswordUpdate = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { password, passwordConfirmation, token } = req.body;
      const updatedUser = await this.authService.resetPasswordUpdate(
        password,
        passwordConfirmation,
        token
      );

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Password updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };
}
