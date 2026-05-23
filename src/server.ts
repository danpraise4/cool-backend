import http from "http";
import app from "./app";
import { Server } from "socket.io";
import config from "./shared/config/app.config";
import RedisService from "./shared/services/redis.service";
import { AzureBlobService } from "./shared/services/azure/blobstorage.service";
import WS, { socketUserMiddleware } from "./shared/services/socket/socket.service";
import logger from "./shared/services/logger";
import "./shared/jobs";

const port = Number(process.env.PORT || config.PORT) || 8080;
const host = "0.0.0.0";

const server = http.createServer(app);

RedisService.getInstance();
RedisService.instance.checkConnection();

const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN.split(",").map((o) => o.trim()),
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

io.use(socketUserMiddleware);
WS.getInstance(io);

try {
  AzureBlobService.getInstance(
    config.CLOUDINARY.CLOUD_NAME,
    config.CLOUDINARY.API_KEY,
    config.CLOUDINARY.API_SECRET,
    config.CLOUDINARY.UPLOAD_PRESET
  );
} catch (err) {
  logger.warn({ err }, "Storage service init skipped — server will continue");
}

server.on("error", (error) => {
  logger.error({ error }, "HTTP server error");
});

server.listen(port, host, () => {
  logger.info(`${config.APP_NAME} running on http://${host}:${port} [${config.NODE_ENV}]`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
};

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection");
  shutdown("unhandledRejection");
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
