import type { NextFunction, Request, Response } from "express";

import { getEnv } from "@/config/env";
import { bearerToken, verifyAccessToken } from "@/services/auth.service";
import { HttpError } from "@/utils/http-error";

/**
 * Requires a valid JWT in (priority):
 * 1. HttpOnly cookie `AUTH_COOKIE_NAME`
 * 2. `Authorization: Bearer <token>`
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const env = getEnv();
  const fromCookie = req.cookies?.[env.AUTH_COOKIE_NAME];
  const raw =
    typeof fromCookie === "string" && fromCookie.length > 0
      ? fromCookie
      : bearerToken(req);

  if (!raw) {
    next(new HttpError(401, "Not authenticated", "UNAUTHORIZED"));
    return;
  }

  try {
    const payload = verifyAccessToken(raw);
    req.auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
    };
    next();
  } catch (e) {
    next(e);
  }
}
