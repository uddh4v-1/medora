import { z } from "zod";

export const updateClinicBodySchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().min(4).max(32).optional(),
});
export type UpdateClinicBody = z.infer<typeof updateClinicBodySchema>;
