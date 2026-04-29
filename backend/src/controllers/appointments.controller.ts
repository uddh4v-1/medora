import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import {
  appointmentsQuerySchema,
  createAppointmentBodySchema,
  appointmentIdParamSchema,
  updateAppointmentStatusBodySchema,
} from "@/schemas/appointments.schemas";
import {
  fetchAppointments,
  createAppointment,
  updateAppointmentStatus,
} from "@/services/appointments.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function getAppointments(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = appointmentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await fetchAppointments(clinicId, parsed.data);
  res.status(200).json(data);
}

export async function postAppointment(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = createAppointmentBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await createAppointment(clinicId, parsed.data);
  res.status(201).json(data);
}

export async function patchAppointmentStatus(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const params = appointmentIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Invalid appointment id", "VALIDATION_ERROR");
  }
  const parsed = updateAppointmentStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  await updateAppointmentStatus(clinicId, params.data.appointmentId, parsed.data);
  res.status(200).json({ ok: true });
}
