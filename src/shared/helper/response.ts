import { Response } from "express";

interface ApiSuccessPayload<T> {
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

interface ApiErrorPayload {
  message: string;
  code?: string;
}

export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  payload: ApiSuccessPayload<T>
): Response {
  return res.status(statusCode).json({
    success: true,
    message: payload.message,
    ...(payload.data !== undefined && { data: payload.data }),
    ...(payload.meta && { meta: payload.meta }),
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  payload: ApiErrorPayload
): Response {
  return res.status(statusCode).json({
    success: false,
    message: payload.message,
    ...(payload.code && { code: payload.code }),
  });
}
