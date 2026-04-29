import { z } from "zod";

export const auditEventBodySchema = z.object({
  action: z.enum(["PAGE_VIEW", "BUTTON_CLICK", "FORM_SUBMIT", "CUSTOM"]),
  resource: z.string().min(1).max(512),
  metadata: z.record(z.unknown()).optional(),
});

export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  userId: z.string().optional(),
  clinicId: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type AuditEventBody = z.infer<typeof auditEventBodySchema>;
export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
