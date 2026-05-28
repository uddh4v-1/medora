import { HttpError } from "@/utils/http-error";

export function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export function requireUserId(req: Request): string {
  const userId = req.auth?.userId;
  if (!userId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return userId;
}