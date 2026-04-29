import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const prescriptionItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  dosage: z.string().trim().min(1).max(100),
  frequency: z.string().trim().min(1).max(50),
  duration: z.string().trim().min(1).max(50),
  notes: z.string().trim().max(500).optional(),
});

export const createPrescriptionBodySchema = z.object({
  patientId: z.string().trim().min(1),
  doctorId: z.string().trim().min(1).optional().nullable(),
  date: z.string().regex(isoDateRegex, "date must be YYYY-MM-DD").optional(),
  diagnosis: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(1000).optional(),
  items: z.array(prescriptionItemSchema).min(1),
});
export type CreatePrescriptionBody = z.infer<typeof createPrescriptionBodySchema>;

export const prescriptionsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  patientId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PrescriptionsQuery = z.infer<typeof prescriptionsQuerySchema>;

export const prescriptionIdParamSchema = z.object({
  prescriptionId: z.string().trim().min(1),
});
