import httpStatus from "http-status";
import AppException from "../../../infastructure/https/exception/app.exception";
import { NextFunction, Request, Response } from "express";
import { IRegistration } from "../interfaces/auth.interface";
import { RequestType } from "../../../shared/helper/helper";
import { AuthAdminService } from "../services/auth.admin.service";

export default class AuthAdminController {
  constructor(readonly authService: AuthAdminService) {}

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, password } = req.body;

      // login user
      console.log(phone, password);
      const user = await this.authService.login(phone, password);

      // generate token
      const token = await this.authService.generateToken(
        user.id,
        `${user.firstName} ${user.lastName}`
      );

      res.status(httpStatus.OK).json({
        message: "Login successful",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier } = req.body;
      const { user, token } = await this.authService.register(identifier);

      res.status(httpStatus.OK).json({
        message: `Register successful. For testing purposes, your OTP is ${token}`,
        data: user,
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
      //
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

  public completeRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (req.body.password !== req.body.confirmPassword) {
        throw new AppException(
          "Password and confirm password do not match",
          httpStatus.BAD_REQUEST
        );
      }

      delete req.body.confirmPassword;

      const data: IRegistration = req.body;
      const user = await this.authService.completeRegistration(data);
      const token = await this.authService.generateToken(
        user.id,
        `${user.firstName} ${user.lastName}`
      );

      res.status(httpStatus.OK).json({
        message: "Registration completed successfully",
        data: {
          user,
          token,
        },
      });
    } catch (error: any) {
      return next(
        new AppException(error.message, error.status || httpStatus.BAD_REQUEST)
      );
    }
  };

  public logout = async (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

  public refreshToken = async (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

  public forgotPassword = async (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

  public resetPassword = async (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

  public verifyEmail = async (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

  public verifyResetPassword = async (
    _req: Request,
    _res: Response,
    _next: NextFunction
  ) => {};

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
