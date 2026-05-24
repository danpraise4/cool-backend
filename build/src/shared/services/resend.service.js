"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendService = exports.Template = void 0;
const app_config_1 = __importDefault(require("../config/app.config"));
const resend_1 = require("resend");
const email_templates_1 = require("./email/email.templates");
const DEFAULT_FROM = `${app_config_1.default.APP_NAME} <${app_config_1.default.SENDGRID_FROM_EMAIL}>`;
var Template;
(function (Template) {
    Template["OTP"] = "OTP";
})(Template || (exports.Template = Template = {}));
class ResendService {
    resend = new resend_1.Resend(app_config_1.default.RESEND.API_KEY);
    async sendEmail(email, template, data) {
        if (template !== Template.OTP) {
            throw new Error(`Unknown email template: ${template}`);
        }
        const rendered = (0, email_templates_1.renderOtpEmail)({ otp: data.otp, expiryMinutes: 5 });
        const response = await this.resend.emails.send({
            from: DEFAULT_FROM,
            to: email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
        });
        return response;
    }
    async sendRendered(to, rendered) {
        return this.resend.emails.send({
            from: DEFAULT_FROM,
            to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
        });
    }
    /** Send a test email to one or more addresses (for manual verification). */
    async sendTestEmails(emails, options) {
        const message = options?.message ??
            `This is a test email from ${app_config_1.default.APP_NAME}. If you received this, email delivery is working.`;
        const rendered = (0, email_templates_1.renderTestEmail)({
            message,
            sentAt: new Date().toISOString(),
        });
        const subject = options?.subject ?? rendered.subject;
        return Promise.all(emails.map(async (email) => {
            try {
                const response = await this.resend.emails.send({
                    from: DEFAULT_FROM,
                    to: email,
                    subject,
                    html: rendered.html,
                    text: rendered.text,
                });
                if (response.error) {
                    return { email, success: false, error: response.error.message };
                }
                return { email, success: true, id: response.data?.id };
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return { email, success: false, error: msg };
            }
        }));
    }
}
exports.ResendService = ResendService;
