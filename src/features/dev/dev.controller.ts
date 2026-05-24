import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../shared/config/app.config";
import { sendSuccess } from "../../shared/helper/response";
import { ResendService } from "../../shared/services/resend.service";
import AppException from "../../infastructure/https/exception/app.exception";

const resendService = new ResendService();

function isEmailTestAllowed(req: Request): boolean {
  if (config.ENVIRONMENT === "development" || config.NODE_ENV === "development") {
    return true;
  }
  const secret = process.env.EMAIL_TEST_SECRET;
  if (!secret) return false;
  return req.headers["x-email-test-secret"] === secret;
}

export class DevController {
  public sendTestEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!isEmailTestAllowed(req)) {
        throw new AppException(
          "Email test endpoint is disabled. Set ENVIRONMENT=development or provide x-email-test-secret.",
          httpStatus.FORBIDDEN
        );
      }

      const { emails, subject, message } = req.body as {
        emails: string[];
        subject?: string;
        message?: string;
      };

      const results = await resendService.sendTestEmails(emails, { subject, message });
      const sent = results.filter((r) => r.success).length;
      const failed = results.length - sent;

      return sendSuccess(res, httpStatus.OK, {
        message: `Sent ${sent} of ${results.length} test email(s)`,
        data: { results, sent, failed },
      });
    } catch (err) {
      return next(err);
    }
  };
}

export const devController = new DevController();
