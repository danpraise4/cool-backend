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

app.use((req: Request, res: Response, next: NextFunction) => {

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

if (config.ENVIRONMENT === ENVIRONMENT_TYPE.PRODUCTION || config.ENVIRONMENT === ENVIRONMENT_TYPE.STAGING) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

if (config.ENVIRONMENT === ENVIRONMENT_TYPE.DEVELOPMENT) {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10MB' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(hpp());
app.use(helmet());

// Rate Limiter
if (config.ENVIRONMENT === ENVIRONMENT_TYPE.PRODUCTION) {
  const limiter = rateLimit({
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
  res.send(`<b>Welcome to ${config.APP_NAME}</b>`);
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