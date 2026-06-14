"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailLayout = renderEmailLayout;
exports.renderOtpEmail = renderOtpEmail;
exports.renderTestEmail = renderTestEmail;
exports.renderNotificationEmail = renderNotificationEmail;
exports.formatMoney = formatMoney;
exports.formatDateTime = formatDateTime;
const app_config_1 = __importDefault(require("../../config/app.config"));
const BRAND = {
    name: app_config_1.default.APP_NAME,
    primary: "#16a34a",
    primaryDark: "#15803d",
    text: "#1f2937",
    muted: "#6b7280",
    background: "#f3f4f6",
    card: "#ffffff",
    border: "#e5e7eb",
};
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function renderEmailLayout(options) {
    const { preheader, title, bodyHtml, footerNote } = options;
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.background};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${BRAND.primaryDark} 100%);padding:28px 32px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">${escapeHtml(BRAND.name)}</p>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);">Recycle smarter. Live greener.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${BRAND.text};">${escapeHtml(title)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">
                ${footerNote ? `${escapeHtml(footerNote)}<br /><br />` : ""}
                If you did not request this email, you can safely ignore it.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:${BRAND.muted};">
                © ${year} ${escapeHtml(BRAND.name)}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
function renderOtpEmail(data) {
    const otp = escapeHtml(data.otp);
    const expiry = data.expiryMinutes;
    const bodyHtml = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.text};">
      Use the verification code below to continue. This code expires in <strong>${expiry} minutes</strong>.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:${BRAND.background};border:1px dashed ${BRAND.primary};border-radius:10px;padding:18px 28px;text-align:center;">
          <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:${BRAND.primaryDark};font-family:'Courier New',Courier,monospace;">${otp}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
      For your security, never share this code with anyone — including ${escapeHtml(BRAND.name)} support.
    </p>`;
    const text = [
        `${BRAND.name} verification code`,
        "",
        `Your code: ${data.otp}`,
        `Expires in ${expiry} minutes.`,
        "",
        "If you did not request this code, you can ignore this email.",
    ].join("\n");
    return {
        subject: `${BRAND.name} verification code`,
        html: renderEmailLayout({
            preheader: `Your ${BRAND.name} code is ${data.otp}`,
            title: "Verify your identity",
            bodyHtml,
            footerNote: "This code can only be used once.",
        }),
        text,
    };
}
function renderTestEmail(data) {
    const message = escapeHtml(data.message);
    const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">
      ${message}
    </p>
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">
      Sent at ${escapeHtml(data.sentAt)}
    </p>`;
    const text = [
        `${BRAND.name} test email`,
        "",
        data.message,
        "",
        `Sent at ${data.sentAt}`,
    ].join("\n");
    return {
        subject: `${BRAND.name} — email test`,
        html: renderEmailLayout({
            preheader: data.message,
            title: "Email delivery test",
            bodyHtml,
        }),
        text,
    };
}
function detailsTable(details) {
    const rows = Object.entries(details)
        .map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:${BRAND.muted};font-size:14px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:14px;color:${BRAND.text};font-weight:600;">${escapeHtml(value)}</td></tr>`)
        .join("");
    return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px 0 0;width:100%;border-top:1px solid ${BRAND.border};">${rows}</table>`;
}
function renderNotificationEmail(data) {
    const greeting = data.greeting
        ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">Hi ${escapeHtml(data.greeting)},</p>`
        : "";
    const paragraphs = data.paragraphs
        .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${BRAND.text};">${escapeHtml(p)}</p>`)
        .join("");
    const bodyHtml = `${greeting}${paragraphs}${data.details ? detailsTable(data.details) : ""}`;
    const textLines = [
        data.title,
        "",
        ...(data.greeting ? [`Hi ${data.greeting},`, ""] : []),
        ...data.paragraphs,
        "",
    ];
    if (data.details) {
        for (const [label, value] of Object.entries(data.details)) {
            textLines.push(`${label}: ${value}`);
        }
        textLines.push("");
    }
    return {
        subject: data.subject,
        html: renderEmailLayout({
            preheader: data.preheader,
            title: data.title,
            bodyHtml,
            footerNote: data.footerNote,
        }),
        text: textLines.join("\n"),
    };
}
function formatMoney(amount, currency = "NGN") {
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
            minimumFractionDigits: 2,
        }).format(amount);
    }
    catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}
function formatDateTime(date = new Date()) {
    return date.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    }) + " UTC";
}
