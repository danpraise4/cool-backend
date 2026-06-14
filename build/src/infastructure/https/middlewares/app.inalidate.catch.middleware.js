"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appInvalidateCatchMiddleware = (_req, res, next) => {
    // Prevent caching completely
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    // Force fresh content
    res.set("ETag", Date.now().toString()); // Generate a new ETag each time
    return next();
};
exports.default = appInvalidateCatchMiddleware;
