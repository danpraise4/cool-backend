"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailNotificationService = exports.EmailNotificationService = exports.EmailNotificationType = void 0;
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const logger_1 = __importDefault(require("../logger"));
const resend_service_1 = require("../resend.service");
const email_templates_1 = require("./email.templates");
const app_config_1 = __importDefault(require("../../config/app.config"));
var EmailNotificationType;
(function (EmailNotificationType) {
    EmailNotificationType["LOGIN"] = "LOGIN";
    EmailNotificationType["REGISTRATION"] = "REGISTRATION";
    EmailNotificationType["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    EmailNotificationType["ACCOUNT_DELETED"] = "ACCOUNT_DELETED";
    EmailNotificationType["PRODUCT_UPLOADED"] = "PRODUCT_UPLOADED";
    EmailNotificationType["CHARITY_REQUEST_RECEIVED"] = "CHARITY_REQUEST_RECEIVED";
    EmailNotificationType["CHARITY_REQUEST_ACCEPTED"] = "CHARITY_REQUEST_ACCEPTED";
    EmailNotificationType["CHARITY_REQUEST_REJECTED"] = "CHARITY_REQUEST_REJECTED";
    EmailNotificationType["WALLET_TOPUP"] = "WALLET_TOPUP";
    EmailNotificationType["WALLET_WITHDRAWAL"] = "WALLET_WITHDRAWAL";
    EmailNotificationType["ORDER_PLACED"] = "ORDER_PLACED";
    EmailNotificationType["ORDER_RECEIVED"] = "ORDER_RECEIVED";
    EmailNotificationType["ORDER_CONFIRMED"] = "ORDER_CONFIRMED";
    EmailNotificationType["RECYCLE_REQUEST_SUBMITTED"] = "RECYCLE_REQUEST_SUBMITTED";
})(EmailNotificationType || (exports.EmailNotificationType = EmailNotificationType = {}));
/** Security alerts are always sent when the user has an email address. */
const SECURITY_EVENTS = new Set([
    EmailNotificationType.LOGIN,
    EmailNotificationType.PASSWORD_CHANGED,
    EmailNotificationType.ACCOUNT_DELETED,
]);
function buildEmail(type, payload) {
    const name = payload.firstName || "there";
    const brand = app_config_1.default.APP_NAME;
    const now = (0, email_templates_1.formatDateTime)();
    switch (type) {
        case EmailNotificationType.LOGIN:
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
                subject: `Wallet top-up successful`,
                preheader: "Funds added to your Recycool wallet",
                title: "Wallet topped up",
                greeting: name,
                paragraphs: ["Your wallet top-up was completed successfully."],
                details: {
                    Amount: (0, email_templates_1.formatMoney)(payload.amount ?? 0, payload.currency),
                    Reference: payload.reference || "—",
                    Time: now,
                },
            });
        case EmailNotificationType.WALLET_WITHDRAWAL:
            return (0, email_templates_1.renderNotificationEmail)({
                subject: `Withdrawal initiated`,
                preheader: "A withdrawal was processed from your wallet",
                title: "Withdrawal processed",
                greeting: name,
                paragraphs: [
                    "Your withdrawal request has been processed.",
                    "Funds may take a short time to arrive in your bank account depending on your bank.",
                ],
                details: {
                    Amount: (0, email_templates_1.formatMoney)(payload.amount ?? 0, payload.currency),
                    Reference: payload.reference || "—",
                    Time: now,
                },
            });
        case EmailNotificationType.ORDER_PLACED:
            return (0, email_templates_1.renderNotificationEmail)({
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
                    Amount: (0, email_templates_1.formatMoney)(payload.amount ?? 0, payload.currency),
                    Reference: payload.reference || "—",
                },
            });
        case EmailNotificationType.ORDER_RECEIVED:
            return (0, email_templates_1.renderNotificationEmail)({
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
                    Amount: (0, email_templates_1.formatMoney)(payload.amount ?? 0, payload.currency),
                    Reference: payload.reference || "—",
                },
            });
        case EmailNotificationType.ORDER_CONFIRMED:
            return (0, email_templates_1.renderNotificationEmail)({
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
                    Amount: (0, email_templates_1.formatMoney)(payload.amount ?? 0, payload.currency),
                },
            });
        case EmailNotificationType.RECYCLE_REQUEST_SUBMITTED:
            return (0, email_templates_1.renderNotificationEmail)({
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
            return (0, email_templates_1.renderNotificationEmail)({
                subject: `${brand} notification`,
                preheader: "You have a new notification",
                title: "Notification",
                greeting: name,
                paragraphs: ["You have a new update on your account."],
            });
    }
}
class EmailNotificationService {
    resend = new resend_service_1.ResendService();
    /** Fire-and-forget — never throws to callers. */
    notifyUser(userId, type, payload = {}) {
        void this.sendToUser(userId, type, payload);
    }
    /** Fire-and-forget direct email when userId is unavailable. */
    notifyEmail(email, type, payload = {}, options) {
        void this.sendToEmail(email, type, payload, options?.force ?? false);
    }
    async sendToUser(userId, type, payload) {
        try {
            const user = await connect_1.default.user.findUnique({
                where: { id: userId },
                include: { settings: true },
            });
            if (!user?.email)
                return;
            const isSecurity = SECURITY_EVENTS.has(type);
            if (!isSecurity && user.settings?.isEmailNotificationsEnabled === false) {
                return;
            }
            await this.dispatch(user.email, type, {
                ...payload,
                firstName: payload.firstName ?? user.firstName,
            });
        }
        catch (err) {
            logger_1.default.warn({ err, userId, type }, "email notification failed");
        }
    }
    async sendToEmail(email, type, payload, force) {
        try {
            if (!force) {
                const user = await connect_1.default.user.findFirst({
                    where: { email: email.toLowerCase() },
                    include: { settings: true },
                });
                const isSecurity = SECURITY_EVENTS.has(type);
                if (user &&
                    !isSecurity &&
                    user.settings?.isEmailNotificationsEnabled === false) {
                    return;
                }
            }
            await this.dispatch(email, type, payload);
        }
        catch (err) {
            logger_1.default.warn({ err, email, type }, "email notification failed");
        }
    }
    async dispatch(email, type, payload) {
        const rendered = buildEmail(type, payload);
        const response = await this.resend.sendRendered(email, rendered);
        if (response.error) {
            logger_1.default.warn({ email, type, error: response.error.message }, "email notification rejected by provider");
        }
    }
}
exports.EmailNotificationService = EmailNotificationService;
exports.emailNotificationService = new EmailNotificationService();
