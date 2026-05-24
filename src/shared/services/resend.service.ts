import config from "../config/app.config";
import { Resend } from "resend";
import { renderOtpEmail, renderTestEmail, RenderedEmail } from "./email/email.templates";

const DEFAULT_FROM = `${config.APP_NAME} <${config.SENDGRID_FROM_EMAIL}>`;

export enum Template {
  OTP = "OTP",
}

export class ResendService {
  private readonly resend = new Resend(config.RESEND.API_KEY);

  public async sendEmail(
    email: string,
    template: Template,
    data: { otp: string }
  ) {
    if (template !== Template.OTP) {
      throw new Error(`Unknown email template: ${template}`);
    }

    const rendered = renderOtpEmail({ otp: data.otp, expiryMinutes: 5 });

    const response = await this.resend.emails.send({
      from: DEFAULT_FROM,
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return response;
  }

  public async sendRendered(to: string, rendered: RenderedEmail) {
    return this.resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  /** Send a test email to one or more addresses (for manual verification). */
  public async sendTestEmails(
    emails: string[],
    options?: { subject?: string; message?: string }
  ): Promise<{ email: string; success: boolean; id?: string; error?: string }[]> {
    const message =
      options?.message ??
      `This is a test email from ${config.APP_NAME}. If you received this, email delivery is working.`;
    const rendered = renderTestEmail({
      message,
      sentAt: new Date().toISOString(),
    });
    const subject = options?.subject ?? rendered.subject;

    return Promise.all(
      emails.map(async (email) => {
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
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { email, success: false, error: msg };
        }
      })
    );
  }
}
