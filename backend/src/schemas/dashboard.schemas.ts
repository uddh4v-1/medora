import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const patientsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PatientsQuery = z.infer<typeof patientsQuerySchema>;

export const queueStatusSchema = z.enum(["waiting", "in-progress", "completed"]);

export const queueQuerySchema = z.object({
  status: queueStatusSchema.optional(),
});

export type QueueQuery = z.infer<typeof queueQuerySchema>;

export const visitIdParamSchema = z.object({
  visitId: z.string().trim().min(1),
});

export const updateQueueStatusBodySchema = z.object({
  status: queueStatusSchema,
});

export type UpdateQueueStatusBody = z.infer<typeof updateQueueStatusBodySchema>;

export const invoicesQuerySchema = z.object({
  status: z.enum(["paid", "unpaid"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type InvoicesQuery = z.infer<typeof invoicesQuerySchema>;

export const revenueSummaryQuerySchema = z.object({
  from: z.string().regex(isoDateRegex, "from must be YYYY-MM-DD"),
  to: z.string().regex(isoDateRegex, "to must be YYYY-MM-DD"),
});

export type RevenueSummaryQuery = z.infer<typeof revenueSummaryQuerySchema>;

export const reportsQuerySchema = z.object({
  from: z.string().regex(isoDateRegex, "from must be YYYY-MM-DD"),
  to: z.string().regex(isoDateRegex, "to must be YYYY-MM-DD"),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;