import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import {
  createTeamMemberBodySchema,
  teamMemberIdParamSchema,
} from "@/schemas/team.schemas";
import { fetchTeamMembers, addTeamMember, removeTeamMember } from "@/services/team.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function getTeamMembers(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const data = await fetchTeamMembers(clinicId);
  res.status(200).json(data);
}

export async function postTeamMember(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = createTeamMemberBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await addTeamMember(clinicId, parsed.data);
  res.status(201).json(data);
}

export async function deleteTeamMember(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const requesterId = req.auth!.userId;
  const params = teamMemberIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Invalid user id", "VALIDATION_ERROR");
  }
  await removeTeamMember(clinicId, params.data.userId, requesterId);
  res.status(200).json({ ok: true });
}
