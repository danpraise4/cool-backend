"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.devController = exports.DevController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_config_1 = __importDefault(require("../../shared/config/app.config"));
const response_1 = require("../../shared/helper/response");
const resend_service_1 = require("../../shared/services/resend.service");
const app_exception_1 = __importDefault(require("../../infastructure/https/exception/app.exception"));
const resendService = new resend_service_1.ResendService();
function isEmailTestAllowed(req) {
    if (app_config_1.default.ENVIRONMENT === "development" || app_config_1.default.NODE_ENV === "development") {
        return true;
    }
    const secret = process.env.EMAIL_TEST_SECRET;
    if (!secret)
        return false;
    return req.headers["x-email-test-secret"] === secret;
}
class DevController {
    sendTestEmail = async (req, res, next) => {
        try {
            if (!isEmailTestAllowed(req)) {
                throw new app_exception_1.default("Email test endpoint is disabled. Set ENVIRONMENT=development or provide x-email-test-secret.", http_status_1.default.FORBIDDEN);
            }
            const { emails, subject, message } = req.body;
            const results = await resendService.sendTestEmails(emails, { subject, message });
            const sent = results.filter((r) => r.success).length;
            const failed = results.length - sent;
            return (0, response_1.sendSuccess)(res, http_status_1.default.OK, {
                message: `Sent ${sent} of ${results.length} test email(s)`,
                data: { results, sent, failed },
            });
        }
        catch (err) {
            return next(err);
        }
    };
}
exports.DevController = DevController;
exports.devController = new DevController();
