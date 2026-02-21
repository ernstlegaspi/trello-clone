import type { NextFunction, Request, Response } from "express";

type ErrorResponsePayload = {
  message: string;
  details?: unknown;
  stack?: string;
};

const errorHandler = (
  error: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const payload: ErrorResponsePayload = {
    message: error.message || "Internal server error"
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== "production" && statusCode >= 500) {
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
};

export default errorHandler;
