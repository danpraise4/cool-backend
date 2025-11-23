"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_sslify_1 = __importDefault(require("express-sslify"));
const morgan_1 = __importDefault(require("morgan"));
const hpp_1 = __importDefault(require("hpp"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const http_status_1 = __importDefault(require("http-status"));
const app_constants_1 = require("./shared/config/app.constants");
const app_config_1 = __importDefault(require("./shared/config/app.config"));
const routes_module_1 = __importDefault(require("./infastructure/https/routes/routes.module"));
const app_exception_handler_1 = require("./infastructure/https/exception/app.exception.handler");
const app_exception_1 = __importDefault(require("./infastructure/https/exception/app.exception"));
const app = (0, express_1.default)();
function getClientIP(req) {
    const header = req.headers['x-forwarded-for'];
    if (header) {
        const ips = header.split(',');
        return ips[0];
    }
    return req.connection.remoteAddress;
}
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    return next();
});
if (app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.PRODUCTION || app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.STAGING) {
    app.use(express_sslify_1.default.HTTPS({ trustProtoHeader: true }));
}
if (app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.DEVELOPMENT) {
    app.use((0, morgan_1.default)('dev'));
}
app.use(express_1.default.json({ limit: '10MB' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, hpp_1.default)());
app.use((0, helmet_1.default)());
// Rate Limiter
if (app_config_1.default.ENVIRONMENT === app_constants_1.ENVIRONMENT_TYPE.PRODUCTION) {
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 20,
        skipSuccessfulRequests: true,
        keyGenerator: (req) => getClientIP(req),
        message: 'Too many requests from this IP, please try again in an 15mins!',
    });
    app.use('/api', limiter);
}
// Disable XSRF protection
app.disable('x-powered-by');
app.get('/', (_req, res) => {
    res.send(`<b>Welcome to ${app_config_1.default.APP_NAME}</b>`);
});
// Socket.IO health check endpoint
app.get('/socket.io/health', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Socket.IO server is running',
        timestamp: new Date().toISOString()
    });
});
// v1 Routes
app.use('/api/v1', routes_module_1.default);
app.all('*', (req, _res, next) => {
    return next(new app_exception_1.default(`Cant find ${req.originalUrl} on the server.`, http_status_1.default.NOT_FOUND));
});
app.use(app_exception_handler_1.ErrorConverter);
app.use(app_exception_handler_1.ErrorHandler);
exports.default = app;
