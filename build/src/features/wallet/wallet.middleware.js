"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bankAccountResolveLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
/** Limit account resolve attempts to reduce enumeration abuse. */
exports.bankAccountResolveLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const user = req.user;
        return user?.id ?? req.ip ?? "unknown";
    },
    message: {
        success: false,
        message: "Too many account verification attempts. Please try again later.",
    },
});
