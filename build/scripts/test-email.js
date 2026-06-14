"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Send test emails via Resend.
 *
 * Usage:
 *   npx ts-node scripts/test-email.ts you@example.com friend@example.com
 *   npm run test:email -- you@example.com
 *
 * Optional env:
 *   TEST_EMAIL_SUBJECT="Custom subject"
 *   TEST_EMAIL_MESSAGE="Custom body text"
 */
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const resend_service_1 = require("../src/shared/services/resend.service");
async function main() {
    const emails = process.argv.slice(2).map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (emails.length === 0) {
        console.error("Usage: npx ts-node scripts/test-email.ts <email> [email2 ...]");
        process.exit(1);
    }
    const invalid = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (invalid.length) {
        console.error("Invalid email(s):", invalid.join(", "));
        process.exit(1);
    }
    const service = new resend_service_1.ResendService();
    const results = await service.sendTestEmails(emails, {
        subject: process.env.TEST_EMAIL_SUBJECT,
        message: process.env.TEST_EMAIL_MESSAGE,
    });
    for (const r of results) {
        if (r.success) {
            console.log(`✓ ${r.email} — id: ${r.id ?? "ok"}`);
        }
        else {
            console.error(`✗ ${r.email} — ${r.error}`);
        }
    }
    const failed = results.filter((r) => !r.success).length;
    process.exit(failed > 0 ? 1 : 0);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
