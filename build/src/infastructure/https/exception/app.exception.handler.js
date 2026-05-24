"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ErrorConverter = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("./app.exception"));
const logger_1 = __importDefault(require("../../../shared/services/logger"));
const ErrorConverter = (err, _req, _res, next) => {
    if (err instanceof app_exception_1.default) {
        return next(err);
    }
    const anyErr = err;
    const statusCode = anyErr.statusCode || http_status_1.default.INTERNAL_SERVER_ERROR;
    const message = anyErr.message || "An unexpected error occurred";
    const converted = new app_exception_1.default(message, statusCode);
    converted.stack = anyErr.stack;
    next(converted);
};
exports.ErrorConverter = ErrorConverter;
const ErrorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    const statusCode = err.statusCode || http_status_1.default.INTERNAL_SERVER_ERROR;
    const message = err.message || "An unexpected error occurred";
    if (statusCode >= 500) {
        logger_1.default.error({ err, req: { method: req.method, url: req.originalUrl } }, message);
    }
    else {
        logger_1.default.warn({ statusCode, url: req.originalUrl }, message);
    }
    const body = {
        success: false,
        message,
    };
    if (process.env.NODE_ENV === "development") {
        body.stack = err.stack;
    }
    res.status(statusCode).json(body);
};
exports.ErrorHandler = ErrorHandler;
