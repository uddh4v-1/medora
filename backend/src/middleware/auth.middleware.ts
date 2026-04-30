import type { NextFunction, Request, Response } from "express";

import { getEnv } from "@/config/env";
import {
  bearerToken,
  IMPERSONATION_COOKIE_NAME,
  verifyAccessToken,
} from "@/services/auth.service";
import { HttpError } from "@/utils/http-error";

/**
 * Requires a valid JWT in (priority):
 * 1. HttpOnly impersonation cookie `medora_impersonation` (SuperAdmin entering a clinic)
 * 2. HttpOnly cookie `AUTH_COOKIE_NAME`
 * 3. `Authorization: Bearer <token>`
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const env = getEnv();

  const impersonationRaw = req.cookies?.[IMPERSONATION_COOKIE_NAME];
  const fromCookie = req.cookies?.[env.AUTH_COOKIE_NAME];
  const raw =
    typeof impersonationRaw === "string" && impersonationRaw.length > 0
      ? impersonationRaw
      : typeof fromCookie === "string" && fromCookie.length > 0
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
      isImpersonation: payload.isImpersonation ?? false,
      impersonatedBy: payload.impersonatedBy,
    };
    next();
  } catch (e) {
    next(e);
  }
}
