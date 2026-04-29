import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import { createVisitBodySchema } from "@/schemas/visits.schemas";
import { createVisit } from "@/services/visits.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function postVisit(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const userId = req.auth!.userId;
  const parsed = createVisitBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await createVisit(clinicId, userId, parsed.data);
  res.status(201).json(data);
}
