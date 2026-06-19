import { ResendService } from "../../shared/services/resend.service";
import prismaClient from "../../infastructure/database/postgreSQL/connect";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import logger from "../../shared/services/logger";

const ADMIN_EMAIL = "admin@recycool.app";

export type SupportContactInput = {
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: "contact" | "feedback" | "report";
  context?: string;
};

export class SupportService {
  private readonly resend = new ResendService();

  public async submitContact(input: SupportContactInput) {
    const ticket = await prismaClient.supportTicket.create({
      data: {
        userId: input.userId,
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        type: input.type,
        context: input.context,
      },
    });

    const typeLabel = input.type.charAt(0).toUpperCase() + input.type.slice(1);
    const emailSubject = `[Recycool ${input.type}] ${input.subject}`;
    const timestamp = new Date().toISOString();

    const html = `
      <h2>Recycool ${typeLabel}</h2>
      <p><strong>User ID:</strong> ${input.userId}</p>
      <p><strong>Type:</strong> ${input.type}</p>
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Subject:</strong> ${input.subject}</p>
      ${input.context ? `<p><strong>Context:</strong><br/>${input.context}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${input.message.replace(/\n/g, "<br/>")}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <p><strong>Ticket ID:</strong> ${ticket.id}</p>
    `;

    const text = [
      `Recycool ${typeLabel}`,
      `User ID: ${input.userId}`,
      `Type: ${input.type}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Subject: ${input.subject}`,
      input.context ? `Context: ${input.context}` : "",
      `Message: ${input.message}`,
      `Timestamp: ${timestamp}`,
      `Ticket ID: ${ticket.id}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const response = await this.resend.sendRendered(ADMIN_EMAIL, {
        subject: emailSubject,
        html,
        text,
      });

      if (response.error) {
        logger.error({ err: response.error, ticketId: ticket.id }, "support email failed");
        throw new AppException(
          "Could not send your message. Please try again later.",
          httpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (err) {
      if (err instanceof AppException) {
        throw err;
      }
      logger.error({ err, ticketId: ticket.id }, "support email failed");
      throw new AppException(
        "Could not send your message. Please try again later.",
        httpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return ticket;
  }
}

export const supportService = new SupportService();
