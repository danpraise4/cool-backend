"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmailValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.sendTestEmailValidator = {
    body: joi_1.default.object({
        emails: joi_1.default.array()
            .items(joi_1.default.string().email().lowercase().trim())
            .min(1)
            .max(10)
            .required()
            .messages({
            "any.required": "Provide at least one email in emails[]",
            "array.min": "Provide at least one email",
            "array.max": "Maximum 10 emails per request",
        }),
        subject: joi_1.default.string().trim().max(200).optional(),
        message: joi_1.default.string().trim().max(2000).optional(),
    }),
};
