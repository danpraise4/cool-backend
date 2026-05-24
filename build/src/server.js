"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const app_config_1 = __importDefault(require("./shared/config/app.config"));
const redis_service_1 = __importDefault(require("./shared/services/redis.service"));
const blobstorage_service_1 = require("./shared/services/azure/blobstorage.service");
const socket_service_1 = __importStar(require("./shared/services/socket/socket.service"));
const logger_1 = __importDefault(require("./shared/services/logger"));
require("./shared/jobs");
const port = Number(process.env.PORT || app_config_1.default.PORT) || 8080;
const host = "0.0.0.0";
const server = http_1.default.createServer(app_1.default);
redis_service_1.default.getInstance();
redis_service_1.default.instance.checkConnection();
const io = new socket_io_1.Server(server, {
    cors: {
        origin: app_config_1.default.CORS_ORIGIN === "*" ? true : app_config_1.default.CORS_ORIGIN.split(",").map((o) => o.trim()),
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: true,
    perMessageDeflate: { threshold: 1024, concurrencyLimit: 10, memLevel: 7 },
});
io.use(socket_service_1.socketUserMiddleware);
socket_service_1.default.getInstance(io);
try {
    blobstorage_service_1.AzureBlobService.getInstance(app_config_1.default.CLOUDINARY.CLOUD_NAME, app_config_1.default.CLOUDINARY.API_KEY, app_config_1.default.CLOUDINARY.API_SECRET, app_config_1.default.CLOUDINARY.UPLOAD_PRESET);
}
catch (err) {
    logger_1.default.warn({ err }, "Storage service init skipped — server will continue");
}
server.on("error", (error) => {
    logger_1.default.error({ error }, "HTTP server error");
});
server.listen(port, host, () => {
    logger_1.default.info(`${app_config_1.default.APP_NAME} running on http://${host}:${port} [${app_config_1.default.NODE_ENV}]`);
});
const shutdown = (signal) => {
    logger_1.default.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
        logger_1.default.info("HTTP server closed");
        process.exit(0);
    });
};
process.on("uncaughtException", (error) => {
    logger_1.default.fatal({ error }, "Uncaught exception");
    shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
    logger_1.default.fatal({ reason }, "Unhandled rejection");
    shutdown("unhandledRejection");
});
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
