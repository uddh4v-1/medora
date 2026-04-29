import { z } from "zod";

export const createPatientBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(32),
  email: z.string().trim().email().max(320).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  gender: z.enum(["Male", "Female"]).optional().nullable(),
  nextVisitDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD")
    .optional()
    .nullable(),
});
export type CreatePatientBody = z.infer<typeof createPatientBodySchema>;

export const updatePatientBodySchema = createPatientBodySchema.partial();
export type UpdatePatientBody = z.infer<typeof updatePatientBodySchema>;

export const patientIdParamSchema = z.object({
  patientId: z.string().trim().min(1),
});
