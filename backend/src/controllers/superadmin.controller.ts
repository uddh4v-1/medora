import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import { getEnv } from "@/config/env";
import { authCookieOptions } from "@/lib/auth-cookie";
import { IMPERSONATION_COOKIE_NAME } from "@/services/auth.service";
import {
  clinicIdParamSchema,
  listClinicsQuerySchema,
  listUsersQuerySchema,
  setClinicStatusBodySchema,
  setUserStatusBodySchema,
  userIdParamSchema,
  listConfigFlagsQuerySchema,
  updateFlagsBodySchema,
  updatePlatformConfigBodySchema,
  listBillingQuerySchema,
  extendTrialBodySchema,
  setBillingStatusBodySchema,
} from "@/schemas/superadmin.schemas";
import {
  listClinics,
  getClinicDetail,
  setClinicStatus,
  deleteClinic,
  listUsers,
  setUserStatus,
  forcePasswordReset,
  verifyUserEmail,
  impersonateClinic,
  getAnalytics,
  listClinicFlags,
  updateClinicFlags,
  getPlatformConfig,
  updatePlatformConfig,
  listBilling,
  extendTrial,
  setBillingStatus,
} from "@/services/superadmin.service";

function getIp(req: Request): string | null {
  const forwarded = (req as unknown as import("express").Request).headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? null;
  return (req as unknown as import("express").Request).socket?.remoteAddress ?? null;
}

export async function listClinicsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listClinicsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listClinics(parsed.data);
  res.status(200).json(data);
}

export async function getClinicDetailHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const data = await getClinicDetail(params.data.id);
  res.status(200).json(data);
}

export async function setClinicStatusHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = setClinicStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await setClinicStatus(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function deleteClinicHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const data = await deleteClinic(params.data.id);
  res.status(200).json(data);
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listUsers(parsed.data);
  res.status(200).json(data);
}

export async function setUserStatusHandler(req: Request, res: Response): Promise<void> {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing user id", "VALIDATION_ERROR");
  const parsed = setUserStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await setUserStatus(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function forcePasswordResetHandler(req: Request, res: Response): Promise<void> {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing user id", "VALIDATION_ERROR");
  const data = await forcePasswordReset(params.data.id);
  res.status(200).json(data);
}

export async function verifyUserEmailHandler(req: Request, res: Response): Promise<void> {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing user id", "VALIDATION_ERROR");
  const data = await verifyUserEmail(params.data.id);
  res.status(200).json(data);
}

// ── Impersonation ─────────────────────────────────────────────────────────────

export async function impersonateClinicHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");

  const superAdminId = req.auth!.userId;
  const data = await impersonateClinic(params.data.id, superAdminId, getIp(req));

  const env = getEnv();
  res.cookie(IMPERSONATION_COOKIE_NAME, data.token, authCookieOptions(env, "1h"));
  res.status(200).json({
    clinicName: data.clinicName,
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
  });
}

export async function exitImpersonationHandler(_req: Request, res: Response): Promise<void> {
  const env = getEnv();
  res.clearCookie(IMPERSONATION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(200).json({ ok: true });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getAnalyticsHandler(_req: Request, res: Response): Promise<void> {
  const data = await getAnalytics();
  res.status(200).json(data);
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export async function listClinicFlagsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listConfigFlagsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listClinicFlags(parsed.data);
  res.status(200).json(data);
}

export async function updateClinicFlagsHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = updateFlagsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updateClinicFlags(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function getPlatformConfigHandler(_req: Request, res: Response): Promise<void> {
  const data = await getPlatformConfig();
  res.status(200).json(data);
}

export async function updatePlatformConfigHandler(req: Request, res: Response): Promise<void> {
  const parsed = updatePlatformConfigBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updatePlatformConfig(parsed.data);
  res.status(200).json(data);
}

// ── Billing ───────────────────────────────────────────────────────────────────

export async function listBillingHandler(req: Request, res: Response): Promise<void> {
  const parsed = listBillingQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listBilling(parsed.data);
  res.status(200).json(data);
}

export async function extendTrialHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = extendTrialBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await extendTrial(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function setBillingStatusHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = setBillingStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await setBillingStatus(params.data.id, parsed.data);
  res.status(200).json(data);
}
