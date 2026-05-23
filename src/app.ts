import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import enforce from "express-sslify";
import pinoHttp from "pino-http";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import httpStatus from "http-status";
import { ENVIRONMENT_TYPE } from "./shared/config/app.constants";
import config from "./shared/config/app.config";
import router from "./infastructure/https/routes/routes.module";
import { ErrorConverter, ErrorHandler } from "./infastructure/https/exception/app.exception.handler";
import AppException from "./infastructure/https/exception/app.exception";
import logger from "./shared/services/logger";

const app: Application = express();

const corsOrigin =
  config.CORS_ORIGIN === "*"
    ? true
    : config.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  })
);

if (
  config.ENVIRONMENT === ENVIRONMENT_TYPE.PRODUCTION ||
  config.ENVIRONMENT === ENVIRONMENT_TYPE.STAGING
) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

app.use(
  pinoHttp({
    logger,
    redact: ["req.headers.authorization"],
    customLogLevel: (_req, res) => {
      if (res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

app.use(express.json({ limit: "10MB" }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(helmet());
app.disable("x-powered-by");

if (config.ENVIRONMENT === ENVIRONMENT_TYPE.PRODUCTION) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: config.API_RATE_LIMIT_MAX,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"] as string;
      return forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress ?? "unknown";
    },
    message: { success: false, message: "Too many requests, please try again later." },
  });
  app.use("/api", limiter);
}

app.get("/", (_req, res) => {
  res.json({ service: config.APP_NAME, status: "ok" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1", router);

app.all("*", (req: Request, _res: Response, next: NextFunction) => {
  next(new AppException(`Route ${req.originalUrl} not found`, httpStatus.NOT_FOUND));
});

app.use(ErrorConverter);
app.use(ErrorHandler);

export default app;
