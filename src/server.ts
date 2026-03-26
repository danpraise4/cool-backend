/* eslint-disable @typescript-eslint/no-explicit-any */
import http from "http";
import app from "./app";
import { Server } from "socket.io";

import config from "./shared/config/app.config";
import RedisService from "./shared/services/redis.service";
import { AzureBlobService } from "./shared/services/azure/blobstorage.service";
import WS, {
  socketUserMiddleware,
} from "./shared/services/socket/socket.service";

import './shared/jobs';

// Use PORT from env (Koyeb/Cloud Run set this; often 8000); fallback 8080 for local
const port: number = Number(process.env.PORT || config.PORT) || 8080;
const host = "0.0.0.0"; // required for containers so health checks can reach the app

const server = http.createServer(app);

// Initialize Redis
RedisService.getInstance();
RedisService.instance.checkConnection();

// Configure Socket.IO with proper CORS and transport options
const io = new Server(server, {
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

io.use(socketUserMiddleware);
WS.getInstance(io);


// Initialize Azure Blob Service (non-blocking; server starts even if blob is unavailable)
try {
  AzureBlobService.getInstance(
    config.CLOUDINARY.CLOUD_NAME,
    config.CLOUDINARY.API_KEY,
    config.CLOUDINARY.API_SECRET,
    config.CLOUDINARY.UPLOAD_PRESET
  );
} catch (err) {
  console.warn("Azure Blob Service init skipped (server will continue):", (err as Error)?.message);
}

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
});

server.listen(port, host, () => {
  console.info(`App is running on http://${host}:${port}`);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.error("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: any) => {
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
