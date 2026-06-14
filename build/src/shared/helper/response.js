"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, statusCode, payload) {
    return res.status(statusCode).json({
        success: true,
        message: payload.message,
        ...(payload.data !== undefined && { data: payload.data }),
        ...(payload.meta && { meta: payload.meta }),
    });
}
function sendError(res, statusCode, payload) {
    return res.status(statusCode).json({
        success: false,
        message: payload.message,
        ...(payload.code && { code: payload.code }),
    });
}
