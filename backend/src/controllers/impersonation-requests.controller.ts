import type { Request, Response } from "express";

import { getEnv } from "@/config/env";
import { IMPERSONATION_COOKIE_NAME } from "@/services/auth.service";
import { authCookieOptions } from "@/lib/auth-cookie";
import { HttpError } from "@/utils/http-error";
import {
  clinicIdParamSchema,
  impersonationRequestIdParamSchema,
  requestImpersonationBodySchema,
} from "@/schemas/superadmin.schemas";
import {
  approveImpersonationRequest,
  consumeImpersonationRequest,
  createImpersonationRequest,
  denyImpersonationRequest,
  listMyImpersonationRequests,
  listPendingRequestsForClinic,
} from "@/services/impersonation-requests.service";

function getIp(req: Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? null;
  return req.socket?.remoteAddress ?? null;
}

// ── SuperAdmin side ──────────────────────────────────────────────────────────

/** SuperAdmin opens a new request for a clinic. */
export async function createImpersonationRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  }
  const body = requestImpersonationBodySchema.safeParse(req.body ?? {});
  if (!body.success) {
    throw new HttpError(
      400,
      body.error.issues[0]?.message ?? "Invalid body",
      "VALIDATION_ERROR",
    );
  }

  const superAdminId = req.auth!.userId;
  const data = await createImpersonationRequest({
    superAdminId,
    clinicId: params.data.id,
    reason: body.data.reason,
    ip: getIp(req),
  });
  res.status(201).json(data);
}

/** SuperAdmin: list their own recent requests. */
export async function listMyImpersonationRequestsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const superAdminId = req.auth!.userId;
  const items = await listMyImpersonationRequests(superAdminId);
  res.status(200).json({ items });
}

/** SuperAdmin: actually enter the clinic after approval — sets impersonation cookie. */
export async function consumeImpersonationRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const params = impersonationRequestIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Missing request id", "VALIDATION_ERROR");
  }

  const superAdminId = req.auth!.userId;
  const data = await consumeImpersonationRequest({
    requestId: params.data.id,
    superAdminId,
    ip: getIp(req),
  });

  const env = getEnv();
  res.cookie(IMPERSONATION_COOKIE_NAME, data.token, authCookieOptions(env, "1h"));
  res.status(200).json({
    clinicId: data.clinicId,
    clinicName: data.clinicName,
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
  });
}

// ── Clinic side (Owner / Doctor) ─────────────────────────────────────────────

/** Owner/Doctor: list pending requests for their own clinic. */
export async function listPendingRequestsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const clinicId = req.auth!.clinicId;
  if (!clinicId) throw new HttpError(403, "No clinic context", "FORBIDDEN");
  // Active impersonation sessions must not approve requests on the clinic's
  // behalf — that would be the SuperAdmin acting as the Owner.
  if (req.auth!.isImpersonation) {
    res.status(200).json({ items: [] });
    return;
  }
  const items = await listPendingRequestsForClinic(clinicId);
  res.status(200).json({ items });
}

/** Owner/Doctor: approve a pending request. */
export async function approveImpersonationRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const params = impersonationRequestIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Missing request id", "VALIDATION_ERROR");
  }
  const clinicId = req.auth!.clinicId;
  if (!clinicId) throw new HttpError(403, "No clinic context", "FORBIDDEN");
  if (req.auth!.isImpersonation) {
    throw new HttpError(
      403,
      "Impersonation sessions cannot approve requests",
      "FORBIDDEN",
    );
  }

  const data = await approveImpersonationRequest({
    requestId: params.data.id,
    responderId: req.auth!.userId,
    responderClinicId: clinicId,
    ip: getIp(req),
  });
  res.status(200).json(data);
}

/** Owner/Doctor: deny a pending request. */
export async function denyImpersonationRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const params = impersonationRequestIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Missing request id", "VALIDATION_ERROR");
  }
  const clinicId = req.auth!.clinicId;
  if (!clinicId) throw new HttpError(403, "No clinic context", "FORBIDDEN");
  if (req.auth!.isImpersonation) {
    throw new HttpError(
      403,
      "Impersonation sessions cannot deny requests",
      "FORBIDDEN",
    );
  }

  const data = await denyImpersonationRequest({
    requestId: params.data.id,
    responderId: req.auth!.userId,
    responderClinicId: clinicId,
    ip: getIp(req),
  });
  res.status(200).json(data);
}
