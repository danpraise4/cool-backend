"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ErrorConverter = void 0;
const http_status_1 = __importDefault(require("http-status"));
const app_exception_1 = __importDefault(require("./app.exception"));
function setDevError(err, res) {
    return res.status(err.statusCode).send({
        status: err.status,
        message: err.message,
        error: err,
        error_stack: err.stack,
    });
}
function setProductionError(err, res) {
    return res.status(err.statusCode).send({
        status: err.status,
        message: err.message,
    });
}
const ErrorConverter = (err, _req, _res, next) => {
    let error = err;
    if (!(error instanceof app_exception_1.default)) {
        const statusCode = error.statusCode || http_status_1.default.BAD_REQUEST;
        const message = error.message || statusCode;
        error = new app_exception_1.default(message, statusCode);
    }
    next(error);
};
exports.ErrorConverter = ErrorConverter;
const ErrorHandler = (err, _req, res, next) => {
    err.statusCode = err.statusCode || http_status_1.default.BAD_REQUEST;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        setDevError(err, res);
    }
    else if (process.env.NODE_ENV === 'production') {
        setProductionError(err, res);
    }
    next();
};
exports.ErrorHandler = ErrorHandler;
