import type { NextFunction, Request, Response } from "express";

import type { AuthUser } from "@/services/auth.service";
import { HttpError } from "@/utils/http-error";

/**
 * Must be placed after `requireAuth`.
 * Usage: requireRole("Owner") or requireRole("Owner", "Doctor")
 */
export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new HttpError(403, "You do not have permission to perform this action", "FORBIDDEN"));
      return;
    }
    next();
  };
}
