import type { Request, Response } from "express";
import { z } from "zod";

import { getEnv } from "@/config/env";
import { authCookieOptions } from "@/lib/auth-cookie";
import { issueAccessToken } from "@/services/auth.service";
import { HttpError } from "@/utils/http-error";
import { updateClinicBodySchema } from "@/schemas/clinic.schemas";
import {
  createBranch,
  createClinicForUser,
  exportAppointmentsCsv,
  exportInvoicesCsv,
  exportPatientsCsv,
  exportPrescriptionsCsv,
  getClinic,
  getLocationSwitchTarget,
  getUserOwnedClinics,
  listLocations,
  updateClinic,
} from "@/services/clinic.service";
import { prisma } from "@/lib/prisma";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

function requireUserId(req: Request): string {
  const userId = req.auth?.userId;
  if (!userId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return userId;
}

export const getClinicHandler = async(req: Request, res: Response): Promise<void> => {
  const clinicId = requireClinicId(req);

  const data = await getClinic(clinicId);
  res.status(200).json(data);
}

export const patchClinic = async(req: Request, res: Response): Promise<void> => {
  const clinicId = requireClinicId(req);
  const parsed = updateClinicBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updateClinic(clinicId, parsed.data);
  res.status(200).json(data);
}

// ── Data Export ───────────────────────────────────────────────────────────────

const EXPORT_TYPES = ["patients", "appointments", "prescriptions", "invoices"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

export const exportClinicDataHandler = async(req: Request, res: Response): Promise<void> => {
  const clinicId = requireClinicId(req);
  const type = req.query.type as string;
  if (!EXPORT_TYPES.includes(type as ExportType)) {
    throw new HttpError(400, "type must be one of: patients, appointments, prescriptions, invoices", "VALIDATION_ERROR");
  }
  const exportFn: Record<ExportType, (id: string) => Promise<string>> = {
    patients: exportPatientsCsv,
    appointments: exportAppointmentsCsv,
    prescriptions: exportPrescriptionsCsv,
    invoices: exportInvoicesCsv,
  };
  const csv = await exportFn[type as ExportType](clinicId);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${type}-${date}.csv"`);
  res.status(200).send(csv);
}

// ── Multi-location ────────────────────────────────────────────────────────────

const CreateBranchBody = z.object({
  name:    z.string().trim().min(2).max(200),
  phone:   z.string().trim().min(4).max(32),
  slug:    z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
  address: z.string().trim().max(500).optional(),
  city:    z.string().trim().max(100).optional(),
});

export const getLocations = async(req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const locations = await listLocations(userId);
  res.json({ locations });
}

export const postCreateBranch = async(req: Request, res: Response): Promise<void> =>{
  const clinicId = requireClinicId(req);
  const parsed = CreateBranchBody.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const branch = await createBranch(clinicId, parsed.data);
  res.status(201).json({ branch });
}

export const postSwitchLocation = async(req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);

  const { targetClinicId } = req.body as { targetClinicId?: unknown };
  if (typeof targetClinicId !== "string" || !targetClinicId) {
    throw new HttpError(400, "targetClinicId is required", "VALIDATION_ERROR");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) throw new HttpError(403, "User not found", "FORBIDDEN");

  const clinic = await getLocationSwitchTarget(userId, targetClinicId);

  const env = getEnv();
  const token = issueAccessToken(
    { id: user.id, email: user.email, role: user.role as "Owner", clinicId: clinic.id },
    { expiresIn: env.JWT_SESSION_EXPIRES_IN },
  );

  res.cookie(env.AUTH_COOKIE_NAME, token, authCookieOptions(env, env.JWT_SESSION_EXPIRES_IN));
  res.json({ clinic: { id: clinic.id, name: clinic.name, slug: clinic.slug } });
}

// ── Multi-clinic (user-owned) ─────────────────────────────────────────────────

export const getUserClinicsHandler = async(req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const clinics = await getUserOwnedClinics(userId);
  res.json({ clinics });
}

const CreateClinicBody = z.object({
  clinicName: z.string().trim().min(2).max(200),
  phone:      z.string().trim().min(4).max(32),
  slug:       z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers and hyphens"),
});

export const postCreateUserClinic = async(req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req);
  const parsed = CreateClinicBody.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const clinic = await createClinicForUser(userId, parsed.data);
  res.status(201).json({ clinic });
}
