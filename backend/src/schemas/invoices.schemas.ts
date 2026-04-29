import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const invoiceItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  amount: z.number().int().min(0),
});

export const createInvoiceBodySchema = z.object({
  patientId: z.string().trim().min(1),
  doctorId: z.string().trim().min(1).optional().nullable(),
  issuedAt: z.string().regex(isoDateRegex, "issuedAt must be YYYY-MM-DD").optional(),
  total: z.number().int().min(0),
  discount: z.number().int().min(0).optional().nullable(),
  gst: z.number().int().min(0).optional().nullable(),
  items: z.array(invoiceItemSchema).min(1),
});
export type CreateInvoiceBody = z.infer<typeof createInvoiceBodySchema>;

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().trim().min(1),
});

export const updateInvoiceStatusBodySchema = z.object({
  status: z.enum(["paid", "unpaid"]),
});
export type UpdateInvoiceStatusBody = z.infer<typeof updateInvoiceStatusBodySchema>;
