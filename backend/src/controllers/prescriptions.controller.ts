import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import {
  prescriptionsQuerySchema,
  createPrescriptionBodySchema,
  prescriptionIdParamSchema,
} from "@/schemas/prescriptions.schemas";
import {
  fetchPrescriptions,
  createPrescription,
  getPrescriptionById,
} from "@/services/prescriptions.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function getPrescriptions(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = prescriptionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await fetchPrescriptions(clinicId, parsed.data);
  res.status(200).json(data);
}

export async function postPrescription(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = createPrescriptionBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await createPrescription(clinicId, parsed.data);
  res.status(201).json(data);
}

export async function getPrescription(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const params = prescriptionIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Invalid prescription id", "VALIDATION_ERROR");
  }
  const data = await getPrescriptionById(clinicId, params.data.prescriptionId);
  res.status(200).json(data);
}
