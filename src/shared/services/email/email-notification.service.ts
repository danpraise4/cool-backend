import prisma from "../../../infastructure/database/postgreSQL/connect";
import logger from "../logger";
import { ResendService } from "../resend.service";
import {
  formatDateTime,
  formatMoney,
  renderNotificationEmail,
  RenderedEmail,
} from "./email.templates";
import config from "../../config/app.config";

export enum EmailNotificationType {
  LOGIN = "LOGIN",
  REGISTRATION = "REGISTRATION",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  ACCOUNT_DELETED = "ACCOUNT_DELETED",
  PRODUCT_UPLOADED = "PRODUCT_UPLOADED",
  CHARITY_REQUEST_RECEIVED = "CHARITY_REQUEST_RECEIVED",
  CHARITY_REQUEST_ACCEPTED = "CHARITY_REQUEST_ACCEPTED",
  CHARITY_REQUEST_REJECTED = "CHARITY_REQUEST_REJECTED",
  WALLET_TOPUP = "WALLET_TOPUP",
  WALLET_WITHDRAWAL = "WALLET_WITHDRAWAL",
  ORDER_PLACED = "ORDER_PLACED",
  ORDER_RECEIVED = "ORDER_RECEIVED",
  ORDER_CONFIRMED = "ORDER_CONFIRMED",
  RECYCLE_REQUEST_SUBMITTED = "RECYCLE_REQUEST_SUBMITTED",
}

/** Security alerts are always sent when the user has an email address. */
const SECURITY_EVENTS = new Set<EmailNotificationType>([
  EmailNotificationType.LOGIN,
  EmailNotificationType.PASSWORD_CHANGED,
  EmailNotificationType.ACCOUNT_DELETED,
]);

export interface EmailNotificationPayload {
  firstName?: string;
  productTitle?: string;
  amount?: number;
  currency?: string;
  reference?: string;
  requesterName?: string;
  sellerName?: string;
  buyerName?: string;
  facilityName?: string;
  materialName?: string;
  scheduledDate?: string;
}

function buildEmail(
  type: EmailNotificationType,
  payload: EmailNotificationPayload
): RenderedEmail {
  const name = payload.firstName || "there";
  const brand = config.APP_NAME;
  const now = formatDateTime();

  switch (type) {
    case EmailNotificationType.LOGIN:
      return renderNotificationEmail({
        subject: `New sign-in to your ${brand} account`,
        preheader: `Sign-in detected on your ${brand} account`,
        title: "New sign-in detected",
        greeting: name,
        paragraphs: [
          "We noticed a successful sign-in to your account.",
          "If this was you, no action is needed. If you did not sign in, please reset your password immediately and contact support.",
        ],
        details: { Time: now },
        footerNote: "This is an automated security alert.",
      });

    case EmailNotificationType.REGISTRATION:
      return renderNotificationEmail({
        subject: `Welcome to ${brand}!`,
        preheader: `Your ${brand} account is ready`,
        title: "Welcome aboard",
        greeting: name,
        paragraphs: [
          "Thanks for joining Recycool. Your account has been created successfully.",
          "You can now recycle smarter, list products, manage your wallet, and track your impact.",
        ],
      });

    case EmailNotificationType.PASSWORD_CHANGED:
      return renderNotificationEmail({
        subject: `Your ${brand} password was changed`,
        preheader: "Your account password was updated",
        title: "Password updated",
        greeting: name,
        paragraphs: [
          "Your password was changed successfully.",
          "If you did not make this change, contact support immediately.",
        ],
        details: { Time: now },
        footerNote: "This is an automated security alert.",
      });

    case EmailNotificationType.ACCOUNT_DELETED:
      return renderNotificationEmail({
        subject: `Your ${brand} account has been deleted`,
        preheader: "Account deletion confirmation",
        title: "Account deleted",
        greeting: name,
        paragraphs: [
          "Your account has been deleted as requested.",
          "We're sorry to see you go. If this was a mistake, contact support as soon as possible.",
        ],
        details: { Time: now },
        footerNote: "This is an automated security alert.",
      });

    case EmailNotificationType.PRODUCT_UPLOADED:
      return renderNotificationEmail({
        subject: `Product listed: ${payload.productTitle || "Your item"}`,
        preheader: "Your product is now live on the marketplace",
        title: "Product uploaded successfully",
        greeting: name,
        paragraphs: [
          "Your product has been uploaded and is now available on the marketplace.",
        ],
        details: {
          Product: payload.productTitle || "—",
          Time: now,
        },
      });

    case EmailNotificationType.CHARITY_REQUEST_RECEIVED:
      return renderNotificationEmail({
        subject: `New request for ${payload.productTitle || "your charity item"}`,
        preheader: "Someone requested your charity product",
        title: "New charity product request",
        greeting: name,
        paragraphs: [
          `${payload.requesterName || "A user"} requested your charity product.`,
          "Review the request in the app to approve or reject it.",
        ],
        details: {
          Product: payload.productTitle || "—",
          Requester: payload.requesterName || "—",
        },
      });

    case EmailNotificationType.CHARITY_REQUEST_ACCEPTED:
      return renderNotificationEmail({
        subject: `Request accepted: ${payload.productTitle || "Charity item"}`,
        preheader: "Your charity product request was approved",
        title: "Request accepted",
        greeting: name,
        paragraphs: [
          "Great news — your request for a charity product was accepted.",
          "Check the app for next steps and collection details.",
        ],
        details: { Product: payload.productTitle || "—" },
      });

    case EmailNotificationType.CHARITY_REQUEST_REJECTED:
      return renderNotificationEmail({
        subject: `Request update: ${payload.productTitle || "Charity item"}`,
        preheader: "Your charity product request was not approved",
        title: "Request not approved",
        greeting: name,
        paragraphs: [
          "Your request for a charity product was not approved this time.",
          "You can browse other available charity items in the app.",
        ],
        details: { Product: payload.productTitle || "—" },
      });

    case EmailNotificationType.WALLET_TOPUP:
      return renderNotificationEmail({
        subject: `Wallet top-up successful`,
        preheader: "Funds added to your Recycool wallet",
        title: "Wallet topped up",
        greeting: name,
        paragraphs: ["Your wallet top-up was completed successfully."],
        details: {
          Amount: formatMoney(payload.amount ?? 0, payload.currency),
          Reference: payload.reference || "—",
          Time: now,
        },
      });

    case EmailNotificationType.WALLET_WITHDRAWAL:
      return renderNotificationEmail({
        subject: `Withdrawal initiated`,
        preheader: "A withdrawal was processed from your wallet",
        title: "Withdrawal processed",
        greeting: name,
        paragraphs: [
          "Your withdrawal request has been processed.",
          "Funds may take a short time to arrive in your bank account depending on your bank.",
        ],
        details: {
          Amount: formatMoney(payload.amount ?? 0, payload.currency),
          Reference: payload.reference || "—",
          Time: now,
        },
      });

    case EmailNotificationType.ORDER_PLACED:
      return renderNotificationEmail({
        subject: `Order placed: ${payload.productTitle || "Marketplace item"}`,
        preheader: "Your marketplace order was placed",
        title: "Order placed",
        greeting: name,
        paragraphs: [
          "Your order has been placed successfully.",
          "The seller will confirm your order shortly.",
        ],
        details: {
          Product: payload.productTitle || "—",
          Amount: formatMoney(payload.amount ?? 0, payload.currency),
          Reference: payload.reference || "—",
        },
      });

    case EmailNotificationType.ORDER_RECEIVED:
      return renderNotificationEmail({
        subject: `New order for ${payload.productTitle || "your product"}`,
        preheader: "A buyer placed an order on your product",
        title: "New order received",
        greeting: name,
        paragraphs: [
          `${payload.buyerName || "A buyer"} placed an order for your product.`,
          "Confirm the order in the app when you're ready to complete the sale.",
        ],
        details: {
          Product: payload.productTitle || "—",
          Buyer: payload.buyerName || "—",
          Amount: formatMoney(payload.amount ?? 0, payload.currency),
          Reference: payload.reference || "—",
        },
      });

    case EmailNotificationType.ORDER_CONFIRMED:
      return renderNotificationEmail({
        subject: `Order confirmed: ${payload.productTitle || "Marketplace item"}`,
        preheader: "A buyer confirmed their order",
        title: "Order confirmed",
        greeting: name,
        paragraphs: [
          "An order for your product was confirmed.",
          "Payment has been credited to your wallet.",
        ],
        details: {
          Product: payload.productTitle || "—",
          Buyer: payload.buyerName || "—",
          Amount: formatMoney(payload.amount ?? 0, payload.currency),
        },
      });

    case EmailNotificationType.RECYCLE_REQUEST_SUBMITTED:
      return renderNotificationEmail({
        subject: "Recycle pickup request submitted",
        preheader: "Your recycle request is being processed",
        title: "Recycle request submitted",
        greeting: name,
        paragraphs: [
          "Your recycle request has been submitted successfully.",
          "We'll keep you updated as it progresses.",
        ],
        details: {
          Facility: payload.facilityName || "—",
          Material: payload.materialName || "—",
          "Scheduled date": payload.scheduledDate || "—",
        },
      });

    default:
      return renderNotificationEmail({
        subject: `${brand} notification`,
        preheader: "You have a new notification",
        title: "Notification",
        greeting: name,
        paragraphs: ["You have a new update on your account."],
      });
  }
}

export class EmailNotificationService {
  private readonly resend = new ResendService();

  /** Fire-and-forget — never throws to callers. */
  notifyUser(
    userId: string,
    type: EmailNotificationType,
    payload: EmailNotificationPayload = {}
  ): void {
    void this.sendToUser(userId, type, payload);
  }

  /** Fire-and-forget direct email when userId is unavailable. */
  notifyEmail(
    email: string,
    type: EmailNotificationType,
    payload: EmailNotificationPayload = {},
    options?: { force?: boolean }
  ): void {
    void this.sendToEmail(email, type, payload, options?.force ?? false);
  }

  private async sendToUser(
    userId: string,
    type: EmailNotificationType,
    payload: EmailNotificationPayload
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { settings: true },
      });

      if (!user?.email) return;

      const isSecurity = SECURITY_EVENTS.has(type);
      if (!isSecurity && user.settings?.isEmailNotificationsEnabled === false) {
        return;
      }

      await this.dispatch(user.email, type, {
        ...payload,
        firstName: payload.firstName ?? user.firstName,
      });
    } catch (err) {
      logger.warn({ err, userId, type }, "email notification failed");
    }
  }

  private async sendToEmail(
    email: string,
    type: EmailNotificationType,
    payload: EmailNotificationPayload,
    force: boolean
  ): Promise<void> {
    try {
      if (!force) {
        const user = await prisma.user.findFirst({
          where: { email: email.toLowerCase() },
          include: { settings: true },
        });
        const isSecurity = SECURITY_EVENTS.has(type);
        if (
          user &&
          !isSecurity &&
          user.settings?.isEmailNotificationsEnabled === false
        ) {
          return;
        }
      }

      await this.dispatch(email, type, payload);
    } catch (err) {
      logger.warn({ err, email, type }, "email notification failed");
    }
  }

  private async dispatch(
    email: string,
    type: EmailNotificationType,
    payload: EmailNotificationPayload
  ): Promise<void> {
    const rendered = buildEmail(type, payload);
    const response = await this.resend.sendRendered(email, rendered);

    if (response.error) {
      logger.warn(
        { email, type, error: response.error.message },
        "email notification rejected by provider"
      );
    }
  }
}

export const emailNotificationService = new EmailNotificationService();
