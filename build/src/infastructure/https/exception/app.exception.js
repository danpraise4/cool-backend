"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppException extends Error {
    statusCode;
    status;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "error" : "fail";
    }
}
exports.default = AppException;
