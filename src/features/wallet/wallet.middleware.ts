import rateLimit from "express-rate-limit";

/** Limit account resolve attempts to reduce enumeration abuse. */
export const bankAccountResolveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as { user?: { id?: string } }).user;
    return user?.id ?? req.ip ?? "unknown";
  },
  message: {
    success: false,
    message: "Too many account verification attempts. Please try again later.",
  },
});
