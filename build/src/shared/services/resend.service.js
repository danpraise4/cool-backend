"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateConfig = exports.Template = exports.ResendService = void 0;
const app_config_1 = __importDefault(require("../config/app.config"));
const resend_1 = require("resend");
class ResendService {
    resend = new resend_1.Resend(app_config_1.default.RESEND.API_KEY);
    async sendEmail(email, template, data) {
        const response = await this.resend.emails.send({
            from: "Support <noreply@apprecycool.com>",
            to: email,
            subject: exports.TemplateConfig[template].subject,
            html: exports.TemplateConfig[template].body.replace("{{otp}}", data.otp),
        });
        console.log(response);
    }
}
exports.ResendService = ResendService;
var Template;
(function (Template) {
    Template["OTP"] = "OTP";
})(Template || (exports.Template = Template = {}));
exports.TemplateConfig = {
    [Template.OTP]: {
        subject: "Recycool OTP",
        body: "Your OTP is {{otp}}",
    },
};
