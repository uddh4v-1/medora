import type { NextFunction, Request, Response } from "express";
import { HttpError } from "@/utils/http-error";

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth || req.auth.role !== "SuperAdmin") {
    next(new HttpError(403, "SuperAdmin access required", "FORBIDDEN"));
    return;
  }
  next();
}
