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
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const app_config_1 = __importDefault(require("./shared/config/app.config"));
const redis_service_1 = __importDefault(require("./shared/services/redis.service"));
const blobstorage_service_1 = require("./shared/services/azure/blobstorage.service");
const socket_service_1 = __importStar(require("./shared/services/socket/socket.service"));
require("./shared/jobs");
const port = +app_config_1.default.PORT || 8080;
const server = http_1.default.createServer(app_1.default);
// Initialize Redis
redis_service_1.default.getInstance();
redis_service_1.default.instance.checkConnection();
// Configure Socket.IO with proper CORS and transport options
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Allow all origins for external users
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    },
    transports: ["websocket", "polling"], // Enable both WebSocket and polling
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    upgradeTimeout: 10000, // 10 seconds
    maxHttpBufferSize: 1e6, // 1MB
    allowUpgrades: true,
    perMessageDeflate: {
        threshold: 1024,
        concurrencyLimit: 10,
        memLevel: 7
    }
});
io.use(socket_service_1.socketUserMiddleware);
socket_service_1.default.getInstance(io);
// Initialize Azure Blob Service
blobstorage_service_1.AzureBlobService.getInstance(app_config_1.default.AZURE_BLOB.CONNECTION_STRING, app_config_1.default.AZURE_BLOB.CONTAINER_NAME);
// Handle server errors
server.on("error", (error) => {
    console.error("Server error:", error);
});
server.listen(port, () => {
    console.info(`App is running on port ${port}`);
});
const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.error("Server closed");
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
};
const unexpectedErrorHandler = (error) => {
    console.error(error);
    exitHandler();
};
process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
process.on("SIGTERM", () => {
    if (server) {
        server.close();
    }
});
