import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import { updateClinicBodySchema } from "@/schemas/clinic.schemas";
import { getClinic, updateClinic } from "@/services/clinic.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function getClinicHandler(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const data = await getClinic(clinicId);
  res.status(200).json(data);
}

export async function patchClinic(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = updateClinicBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updateClinic(clinicId, parsed.data);
  res.status(200).json(data);
}
