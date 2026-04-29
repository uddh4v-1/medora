import type { NextFunction, Request, Response } from "express";
import { logEvent } from "@/services/audit.service";

function getIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? null;
  return req.socket?.remoteAddress ?? null;
}

/**
 * Placed after requireAuth. Logs every API call for authenticated users.
 * Fire-and-forget — never delays the response.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on("finish", () => {
    if (!req.auth) return;
    logEvent({
      userId: req.auth.userId,
      clinicId: req.auth.clinicId ?? null,
      action: "API_CALL",
      resource: `${req.method} ${req.path}`,
      metadata: {
        statusCode: res.statusCode,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
      ip: getIp(req),
      userAgent: req.headers["user-agent"] ?? null,
    });
  });
  next();
}
