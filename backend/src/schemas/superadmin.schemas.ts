import { z } from "zod";

export const clinicIdParamSchema = z.object({ id: z.string().min(1) });


export const listClinicsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
export type ListClinicsQuery = z.infer<typeof listClinicsQuerySchema>;

export const setClinicStatusBodySchema = z.object({
  status: z.enum(["active", "suspended"]),
});
export type SetClinicStatusBody = z.infer<typeof setClinicStatusBodySchema>;

// ── Users ────────────────────────────────────────────────────────────────────

export const userIdParamSchema = z.object({ id: z.string().min(1) });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  role: z.enum(["Owner", "Doctor", "Receptionist"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const setUserStatusBodySchema = z.object({
  status: z.enum(["active", "suspended"]),
});
export type SetUserStatusBody = z.infer<typeof setUserStatusBodySchema>;

// ── Feature Flags ─────────────────────────────────────────────────────────────

export const listConfigFlagsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});
export type ListConfigFlagsQuery = z.infer<typeof listConfigFlagsQuerySchema>;

export const updateFlagsBodySchema = z
  .object({
    publicBooking: z.boolean().optional(),
    whatsappNotifications: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).some((k) => d[k as keyof typeof d] !== undefined), {
    message: "At least one flag is required",
  });
export type UpdateFlagsBody = z.infer<typeof updateFlagsBodySchema>;

export const updatePlatformConfigBodySchema = z
  .object({
    maintenanceMode: z.boolean().optional(),
    bannerMessage: z.string().trim().max(500).nullable().optional(),
  })
  .refine((d) => d.maintenanceMode !== undefined || d.bannerMessage !== undefined, {
    message: "At least one field is required",
  });
export type UpdatePlatformConfigBody = z.infer<typeof updatePlatformConfigBodySchema>;

// ── Billing ───────────────────────────────────────────────────────────────────

export const listBillingQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(["trial", "active", "unpaid", "cancelled"]).optional(),
});
export type ListBillingQuery = z.infer<typeof listBillingQuerySchema>;

export const extendTrialBodySchema = z.object({
  days: z.number().int().min(1).max(365),
});
export type ExtendTrialBody = z.infer<typeof extendTrialBodySchema>;

export const setBillingStatusBodySchema = z.object({
  status: z.enum(["trial", "active", "unpaid", "cancelled"]),
  plan: z.enum(["trial", "starter", "pro"]).optional(),
});
export type SetBillingStatusBody = z.infer<typeof setBillingStatusBodySchema>;

// ── Bulk Operations ───────────────────────────────────────────────────────────

export const bulkClinicActionBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["activate", "suspend", "delete"]),
});
export type BulkClinicActionBody = z.infer<typeof bulkClinicActionBodySchema>;

export const bulkPlanChangeBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  plan: z.enum(["trial", "starter", "pro"]),
  billingStatus: z.enum(["trial", "active", "unpaid", "cancelled"]),
});
export type BulkPlanChangeBody = z.infer<typeof bulkPlanChangeBodySchema>;

// ── Health Scores ─────────────────────────────────────────────────────────────

export const listHealthScoresQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  risk: z.enum(["all", "low", "medium", "high"]).optional(),
});
export type ListHealthScoresQuery = z.infer<typeof listHealthScoresQuerySchema>;

// ── Impersonation Requests ────────────────────────────────────────────────────

export const requestImpersonationBodySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type RequestImpersonationBody = z.infer<
  typeof requestImpersonationBodySchema
>;

export const impersonationRequestIdParamSchema = z.object({
  id: z.string().min(1),
});
