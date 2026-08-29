import type { NextFunction, Request, Response } from "express";

import { z } from "zod/v4";

import type ErrorResponse from "./interfaces/error-response.js";

import { env } from "./env.js";
import { NotFoundError } from "./services/retainers.js";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err: Error, req: Request, res: Response<ErrorResponse>, _next: NextFunction) {
  const statusCode = statusCodeForError(err, res.statusCode);
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}

function statusCodeForError(err: Error, currentStatusCode: number) {
  if (err instanceof z.ZodError) {
    return 400;
  }

  if (err instanceof NotFoundError) {
    return err.statusCode;
  }

  return currentStatusCode !== 200 ? currentStatusCode : 500;
}
