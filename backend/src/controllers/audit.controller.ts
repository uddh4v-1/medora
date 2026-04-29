import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import { auditEventBodySchema, auditLogsQuerySchema } from "@/schemas/audit.schemas";
import { logEvent, getAuditLogs, getSuperAdminStats } from "@/services/audit.service";

function getIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? null;
  return req.socket?.remoteAddress ?? null;
}

export async function postAuditEvent(req: Request, res: Response): Promise<void> {
  const parsed = auditEventBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  logEvent({
    userId: req.auth?.userId ?? null,
    clinicId: req.auth?.clinicId ?? null,
    action: parsed.data.action,
    resource: parsed.data.resource,
    metadata: parsed.data.metadata ?? null,
    ip: getIp(req),
    userAgent: req.headers["user-agent"] ?? null,
  });
  res.status(202).json({ ok: true });
}

export async function getAuditLogsHandler(req: Request, res: Response): Promise<void> {
  const parsed = auditLogsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await getAuditLogs(parsed.data);
  res.status(200).json(data);
}

export async function getSuperAdminStatsHandler(_req: Request, res: Response): Promise<void> {
  const data = await getSuperAdminStats();
  res.status(200).json(data);
}
