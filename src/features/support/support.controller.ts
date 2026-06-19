import { NextFunction, Response } from "express";
import httpStatus from "http-status";
import { RequestType } from "../../shared/helper/helper";
import { supportService } from "./support.services";

export class SupportController {
  public submitContact = async (
    req: RequestType,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await supportService.submitContact({
        userId: req.user.id,
        name: req.body.name,
        email: req.body.email,
        subject: req.body.subject,
        message: req.body.message,
        type: req.body.type,
        context: req.body.context,
      });

      res.status(httpStatus.OK).json({
        success: true,
        status: "success",
        message: "Message sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const supportController = new SupportController();
