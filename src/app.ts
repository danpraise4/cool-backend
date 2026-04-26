import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import enforce from 'express-sslify';

import morgan from 'morgan';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import httpStatus from 'http-status';
import { ENVIRONMENT_TYPE } from './shared/config/app.constants';
import config from './shared/config/app.config';
import router from './infastructure/https/routes/routes.module';
import { ErrorConverter, ErrorHandler } from './infastructure/https/exception/app.exception.handler';
import AppException from './infastructure/https/exception/app.exception';

const app: Application = express();


function getClientIP(req: Request) {
  const header = req.headers['x-forwarded-for'] as string;
  if (header) {
    const ips = header.split(',');
    return ips[0];
  }
  return req.connection.remoteAddress;
}

const corsOriginSetting = config.CORS_ORIGIN || "*";
const corsOrigin =
  corsOriginSetting === "*"
    ? true
    : corsOriginSetting.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  })
);

if (config.ENVIRONMENT === ENVIRONMENT_TYPE.PRODUCTION || config.ENVIRONMENT === ENVIRONMENT_TYPE.STAGING) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

if (config.ENVIRONMENT === ENVIRONMENT_TYPE.DEVELOPMENT) {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "10MB" }));
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(helmet());

// Rate Limiter (failed / error responses; tune via API_RATE_LIMIT_MAX in env)
if (config.ENVIRONMENT === ENVIRONMENT_TYPE.PRODUCTION) {
  const maxRequests = config.API_RATE_LIMIT_MAX ?? 400;
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => getClientIP(req),
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api", limiter);
}

// Disable XSRF protection
app.disable('x-powered-by');
app.get('/', (_req, res) => {
  res.send(`<b>Welcome to ${config.APP_NAME}</b>`);
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
app.use('/api/v1', router);
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
  return next(
    new AppException(
      `Cant find ${req.originalUrl} on the server.`,
      httpStatus.NOT_FOUND
    )
  );
});

app.use(ErrorConverter);
app.use(ErrorHandler);

export default app;