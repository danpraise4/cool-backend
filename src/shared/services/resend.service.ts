import config from "../config/app.config";
import { Resend } from "resend";

export class ResendService {
  private readonly resend = new Resend(config.RESEND.API_KEY);

  public async sendEmail(
    email: string,
    template: keyof typeof Template,
    data: { otp: string }
  ) {
    const response = await this.resend.emails.send({
      from: "Support <noreply@apprecycool.com>",
      to: email,
      subject: TemplateConfig[template].subject,
      html: TemplateConfig[template].body.replace("{{otp}}", data.otp),
    });

    console.log(response);
  }
}

export enum Template {
  OTP = "OTP",
}

export const TemplateConfig = {
  [Template.OTP]: {
    subject: "Recycool OTP",
    body: "Your OTP is {{otp}}",
  },
};
