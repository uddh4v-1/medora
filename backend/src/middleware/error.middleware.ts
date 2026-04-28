import type { NextFunction, Request, Response } from "express";

import { HttpError } from "@/utils/http-error";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    if (process.env.NODE_ENV === "development") console.error(err);
    res.status(err.status).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  const message =
    err instanceof Error ? err.message : "Internal server error";
  const status =
    typeof (err as { status?: number }).status === "number"
      ? (err as { status: number }).status
      : 500;

  if (process.env.NODE_ENV === "development" && err instanceof Error) {
    console.error(err);
  } else {
    console.error(message);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
