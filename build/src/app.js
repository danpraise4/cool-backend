"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_sslify_1 = __importDefault(require("express-sslify"));
const pino_http_1 = __importDefault(require("pino-http"));
const hpp_1 = __importDefault(require("hpp"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const http_status_1 = __importDefault(require("http-status"));
const app_constants_1 = require("./shared/config/app.constants");
const app_config_1 = __importDefault(require("./shared/config/app.config"));
const routes_module_1 = __importDefault(require("./infastructure/https/routes/routes.module"));
const app_exception_handler_1 = require("./infastructure/https/exception/app.exception.handler");
const app_exception_1 = __importDefault(require("./infastructure/https/exception/app.exception"));
const logger_1 = __importDefault(require("./shared/services/logger"));
const app = (0, express_1.default)();
// update
const corsOrigin = app_config_1.default.CORS_ORIGIN === "*"
    ? true
    : app_config_1.default.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
app.use((0, cors_1.default)({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));
if (app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.PRODUCTION ||
    app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.STAGING) {
    app.use(express_sslify_1.default.HTTPS({ trustProtoHeader: true }));
}
app.use((0, pino_http_1.default)({
    logger: logger_1.default,
    redact: ["req.headers.authorization"],
    customLogLevel: (_req, res) => {
        if (res.statusCode >= 500)
            return "error";
        if (res.statusCode >= 400)
            return "warn";
        return "info";
    },
}));
app.use(express_1.default.json({ limit: "10MB" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, hpp_1.default)());
app.use((0, helmet_1.default)());
app.disable("x-powered-by");
if (app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.PRODUCTION) {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: app_config_1.default.API_RATE_LIMIT_MAX,
        skipSuccessfulRequests: true,
        keyGenerator: (req) => {
            const forwarded = req.headers["x-forwarded-for"];
            return forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress ?? "unknown";
        },
        message: { success: false, message: "Too many requests, please try again later." },
    });
    app.use("/api", limiter);
}
app.get("/", (_req, res) => {
    res.json({ service: app_config_1.default.APP_NAME, status: "ok" });
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/v1", routes_module_1.default);
app.all("*", (req, _res, next) => {
    next(new app_exception_1.default(`Route ${req.originalUrl} not found`, http_status_1.default.NOT_FOUND));
});
app.use(app_exception_handler_1.ErrorConverter);
app.use(app_exception_handler_1.ErrorHandler);
exports.default = app;
