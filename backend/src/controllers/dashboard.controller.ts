import type { Request, Response } from "express";


import { HttpError } from "@/utils/http-error";
import { patientsQuerySchema, queueQuerySchema, visitIdParamSchema, updateQueueStatusBodySchema, invoicesQuerySchema, revenueSummaryQuerySchema, reportsQuerySchema } from "@/schemas/dashboard.schemas";
import { fetchDashboardOverview, fetchPatients, fetchQueue, updateQueueStatus, fetchInvoices, fetchRevenueSummary, fetchReportsOverview } from "@/services/dashboard.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) {
    throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  }
  return clinicId;
}

export async function getDashboardOverview(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const doctorId = req.auth?.role === "Doctor" ? req.auth.userId : undefined;
  const data = await fetchDashboardOverview(clinicId, doctorId);
  res.status(200).json(data);
}

export async function getPatients(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);

  const parsed = patientsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid query params";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const data = await fetchPatients(clinicId, parsed.data);
  res.status(200).json(data);
}

export async function getQueue(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);

  const parsed = queueQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid query params";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const doctorId = req.auth?.role === "Doctor" ? req.auth.userId : undefined;
  const data = await fetchQueue(clinicId, parsed.data, doctorId);
  res.status(200).json(data);
}

export async function patchQueueStatus(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);

  const params = visitIdParamSchema.safeParse(req.params);
  if (!params.success) {
    const msg = params.error.issues[0]?.message ?? "Invalid route params";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const body = updateQueueStatusBodySchema.safeParse(req.body);
  if (!body.success) {
    const msg = body.error.issues[0]?.message ?? "Invalid request body";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  await updateQueueStatus(clinicId, params.data.visitId, body.data.status);
  res.status(200).json({ ok: true });
}

export async function getInvoices(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);

  const parsed = invoicesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid query params";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const data = await fetchInvoices(clinicId, parsed.data);
  res.status(200).json(data);
}

export async function getRevenueSummary(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);

  const parsed = revenueSummaryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid query params";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const data = await fetchRevenueSummary(clinicId, parsed.data);
  res.status(200).json(data);
}

export async function getReportsOverview(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);

  const parsed = reportsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid query params";
    throw new HttpError(400, msg, "VALIDATION_ERROR");
  }

  const data = await fetchReportsOverview(clinicId, parsed.data);
  res.status(200).json(data);
}