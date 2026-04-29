import { z } from "zod";

export const createTeamMemberBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  password: z.string().min(6).max(200),
  role: z.enum(["Doctor", "Receptionist"]),
  specialty: z.string().trim().max(120).optional(),
  fee: z.number().int().min(0).optional().nullable(),
});
export type CreateTeamMemberBody = z.infer<typeof createTeamMemberBodySchema>;

export const teamMemberIdParamSchema = z.object({
  userId: z.string().trim().min(1),
});
