import { NextFunction, Request, Response } from "express";
import { ErrorRequestHandler } from "express-serve-static-core";
import httpStatus from "http-status";
import AppException from "./app.exception";
import logger from "../../../shared/services/logger";

export const ErrorConverter = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppException) {
    return next(err);
  }

  const anyErr = err as { statusCode?: number; message?: string; stack?: string };
  const statusCode = anyErr.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const message = anyErr.message || "An unexpected error occurred";
  const converted = new AppException(message, statusCode);
  converted.stack = anyErr.stack;
  next(converted);
};

export const ErrorHandler: ErrorRequestHandler = (
  err: AppException,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  const message = err.message || "An unexpected error occurred";

  if (statusCode >= 500) {
    logger.error({ err, req: { method: req.method, url: req.originalUrl } }, message);
  } else {
    logger.warn({ statusCode, url: req.originalUrl }, message);
  }

  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === "development") {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};
