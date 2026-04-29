import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import {
  createPatientBodySchema,
  updatePatientBodySchema,
  patientIdParamSchema,
} from "@/schemas/patients.schemas";
import {
  createPatient,
  getPatientById,
  updatePatient,
} from "@/services/patients.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function postPatient(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = createPatientBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await createPatient(clinicId, parsed.data);
  res.status(201).json(data);
}

export async function getPatient(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const params = patientIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Invalid patient id", "VALIDATION_ERROR");
  }
  const data = await getPatientById(clinicId, params.data.patientId);
  res.status(200).json(data);
}

export async function patchPatient(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const params = patientIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Invalid patient id", "VALIDATION_ERROR");
  }
  const parsed = updatePatientBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updatePatient(clinicId, params.data.patientId, parsed.data);
  res.status(200).json(data);
}
