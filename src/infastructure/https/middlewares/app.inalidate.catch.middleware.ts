import { NextFunction, Request, Response } from "express";

const appInvalidateCatchMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  // Prevent caching completely
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  // Force fresh content
  res.set("ETag", Date.now().toString()); // Generate a new ETag each time
  return next();
};

export default appInvalidateCatchMiddleware;

 