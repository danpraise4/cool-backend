import httpStatus from "http-status";
import { NextFunction, Request, Response } from "express";
import { IRegistration } from "../interfaces/auth.interface";
import { RequestType } from "../../../shared/helper/helper";
import { AuthAdminService } from "../services/auth.admin.service";
import { sendSuccess } from "../../../shared/helper/response";

export default class AuthAdminController {
  constructor(readonly authService: AuthAdminService) {}

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, password } = req.body;
      const admin = await this.authService.login(phone, password);
      const token = await this.authService.generateToken(
        admin.id,
        `${admin.firstName} ${admin.lastName}`
      );
      delete (admin as { password?: string | null }).password;
      sendSuccess(res, httpStatus.OK, {
        message: "Login successful",
        data: { user: admin, token },
      });
    } catch (error) {
      next(error);
    }
  };

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier } = req.body;
      const { user } = await this.authService.register(identifier);
      sendSuccess(res, httpStatus.CREATED, {
        message: "OTP sent to your email/phone",
        data: user,
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

  public completeRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data: IRegistration = req.body;
      const admin = await this.authService.completeRegistration(data);
      const token = await this.authService.generateToken(
        admin.id,
        `${admin.firstName} ${admin.lastName}`
      );
      delete (admin as { password?: string | null }).password;
      sendSuccess(res, httpStatus.OK, {
        message: "Registration completed successfully",
        data: { user: admin, token },
      });
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
        req.user.id,
        password,
        passwordConfirmation,
        oldPassword
      );
      sendSuccess(res, httpStatus.OK, { message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  };
}
