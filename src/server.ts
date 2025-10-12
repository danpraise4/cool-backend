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

const port: number = +config.PORT || 8080;

const server = http.createServer(app);

// Initialize Redis
RedisService.getInstance();
RedisService.instance.checkConnection();

const io = new Server(server);
io.use(socketUserMiddleware);
WS.getInstance(io);


// Initialize Azure Blob Service
AzureBlobService.getInstance(
  config.AZURE_BLOB.CONNECTION_STRING,
  config.AZURE_BLOB.CONTAINER_NAME
);

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
