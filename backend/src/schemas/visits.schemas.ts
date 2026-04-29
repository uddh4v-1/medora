import { z } from "zod";

export const createVisitBodySchema = z.object({
  patientId: z.string().trim().min(1),
  doctorId: z.string().trim().min(1).optional().nullable(),
  title: z.string().trim().min(1).max(200).default("Visit"),
  reason: z.string().trim().min(1).max(500),
});
export type CreateVisitBody = z.infer<typeof createVisitBodySchema>;
