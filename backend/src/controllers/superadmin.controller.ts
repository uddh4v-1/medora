import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import { getEnv } from "@/config/env";
import { authCookieOptions } from "@/lib/auth-cookie";
import { IMPERSONATION_COOKIE_NAME } from "@/services/auth.service";
import {
  clinicIdParamSchema,
  listClinicsQuerySchema,
  listUsersQuerySchema,
  setClinicStatusBodySchema,
  setUserStatusBodySchema,
  userIdParamSchema,
  listConfigFlagsQuerySchema,
  updateFlagsBodySchema,
  updatePlatformConfigBodySchema,
  listBillingQuerySchema,
  extendTrialBodySchema,
  setBillingStatusBodySchema,
  listHealthScoresQuerySchema,
  bulkClinicActionBodySchema,
  bulkPlanChangeBodySchema,
} from "@/schemas/superadmin.schemas";
import {
  listClinics,
  getClinicDetail,
  setClinicStatus,
  deleteClinic,
  listUsers,
  setUserStatus,
  forcePasswordReset,
  verifyUserEmail,
  impersonateClinic,
  getAnalytics,
  listClinicFlags,
  updateClinicFlags,
  getPlatformConfig,
  updatePlatformConfig,
  listBilling,
  extendTrial,
  setBillingStatus,
  getFinancialDashboard,
  getClinicHealthScores,
  exportClinicsCsv,
  exportUsersCsv,
  exportAuditLogsCsv,
  bulkClinicAction,
  bulkPlanChange,
  getOnboardingStatus,
  listSuperAdminBroadcasts,
  sendSuperAdminBroadcast,
  listSupportTickets,
  getTicketDetail,
  createTicket,
  replyToTicket,
  setTicketStatus,
  listSuperAdmins,
  createSuperAdmin,
  deleteSuperAdmin,
  listPaymentRecords,
  createPaymentRecord,
  listDeletionRequests,
  createDeletionRequest,
  setDeletionRequestStatus,
  exportClinicData,
  getSystemHealth,
  getApiUsage,
  listCustomPlans,
  createCustomPlan,
  updateCustomPlan,
  deleteCustomPlan,
} from "@/services/superadmin.service";

function getIp(req: Request): string | null {
  const forwarded = (req as unknown as import("express").Request).headers?.["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0]?.trim() ?? null;
  return (req as unknown as import("express").Request).socket?.remoteAddress ?? null;
}

export async function listClinicsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listClinicsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listClinics(parsed.data);
  res.status(200).json(data);
}

export async function getClinicDetailHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const data = await getClinicDetail(params.data.id);
  res.status(200).json(data);
}

export async function setClinicStatusHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = setClinicStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await setClinicStatus(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function deleteClinicHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  await deleteClinic(params.data.id);
  res.status(204).end();
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listUsers(parsed.data);
  res.status(200).json(data);
}

export async function setUserStatusHandler(req: Request, res: Response): Promise<void> {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing user id", "VALIDATION_ERROR");
  const parsed = setUserStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await setUserStatus(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function forcePasswordResetHandler(req: Request, res: Response): Promise<void> {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing user id", "VALIDATION_ERROR");
  const data = await forcePasswordReset(params.data.id);
  res.status(200).json(data);
}

export async function verifyUserEmailHandler(req: Request, res: Response): Promise<void> {
  const params = userIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing user id", "VALIDATION_ERROR");
  const data = await verifyUserEmail(params.data.id);
  res.status(200).json(data);
}

// ── Impersonation ─────────────────────────────────────────────────────────────

export async function impersonateClinicHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");

  const superAdminId = req.auth!.userId;
  const data = await impersonateClinic(params.data.id, superAdminId, getIp(req));

  const env = getEnv();
  res.cookie(IMPERSONATION_COOKIE_NAME, data.token, authCookieOptions(env, "1h"));
  res.status(200).json({
    clinicName: data.clinicName,
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
  });
}

export async function exitImpersonationHandler(_req: Request, res: Response): Promise<void> {
  const env = getEnv();
  res.clearCookie(IMPERSONATION_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  res.status(200).json({ ok: true });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function getAnalyticsHandler(_req: Request, res: Response): Promise<void> {
  const data = await getAnalytics();
  res.status(200).json(data);
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export async function listClinicFlagsHandler(req: Request, res: Response): Promise<void> {
  const parsed = listConfigFlagsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listClinicFlags(parsed.data);
  res.status(200).json(data);
}

export async function updateClinicFlagsHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = updateFlagsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updateClinicFlags(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function getPlatformConfigHandler(_req: Request, res: Response): Promise<void> {
  const data = await getPlatformConfig();
  res.status(200).json(data);
}

export async function updatePlatformConfigHandler(req: Request, res: Response): Promise<void> {
  const parsed = updatePlatformConfigBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await updatePlatformConfig(parsed.data);
  res.status(200).json(data);
}

// ── Billing ───────────────────────────────────────────────────────────────────

export async function listBillingHandler(req: Request, res: Response): Promise<void> {
  const parsed = listBillingQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await listBilling(parsed.data);
  res.status(200).json(data);
}

export async function extendTrialHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = extendTrialBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await extendTrial(params.data.id, parsed.data);
  res.status(200).json(data);
}

export async function setBillingStatusHandler(req: Request, res: Response): Promise<void> {
  const params = clinicIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, "Missing clinic id", "VALIDATION_ERROR");
  const parsed = setBillingStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await setBillingStatus(params.data.id, parsed.data);
  res.status(200).json(data);
}

// ── Data Export ───────────────────────────────────────────────────────────────

export async function exportClinicsHandler(_req: Request, res: Response): Promise<void> {
  const csv = await exportClinicsCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="clinics-${new Date().toISOString().slice(0,10)}.csv"`);
  res.status(200).send(csv);
}

export async function exportUsersHandler(_req: Request, res: Response): Promise<void> {
  const csv = await exportUsersCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="users-${new Date().toISOString().slice(0,10)}.csv"`);
  res.status(200).send(csv);
}

export async function exportAuditLogsHandler(_req: Request, res: Response): Promise<void> {
  const csv = await exportAuditLogsCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${new Date().toISOString().slice(0,10)}.csv"`);
  res.status(200).send(csv);
}

// ── Bulk Operations ───────────────────────────────────────────────────────────

export async function bulkClinicActionHandler(req: Request, res: Response): Promise<void> {
  const parsed = bulkClinicActionBodySchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  const data = await bulkClinicAction(parsed.data);
  res.status(200).json(data);
}

export async function bulkPlanChangeHandler(req: Request, res: Response): Promise<void> {
  const parsed = bulkPlanChangeBodySchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  const data = await bulkPlanChange(parsed.data);
  res.status(200).json(data);
}

// ── Financial Dashboard ───────────────────────────────────────────────────────

export async function getFinancialDashboardHandler(_req: Request, res: Response): Promise<void> {
  const data = await getFinancialDashboard();
  res.status(200).json(data);
}

// ── Clinic Health Scores ──────────────────────────────────────────────────────

export async function getClinicHealthScoresHandler(req: Request, res: Response): Promise<void> {
  const parsed = listHealthScoresQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid query", "VALIDATION_ERROR");
  }
  const data = await getClinicHealthScores(parsed.data);
  res.status(200).json(data);
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export async function getOnboardingHandler(req: Request, res: Response): Promise<void> {
  const parsed = listClinicsQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new HttpError(400, "Invalid query", "VALIDATION_ERROR");
  const data = await getOnboardingStatus({ page: parsed.data.page, limit: parsed.data.limit, search: parsed.data.search });
  res.status(200).json(data);
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

export async function listBroadcastsHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  res.status(200).json(await listSuperAdminBroadcasts({ page, limit }));
}

export async function sendBroadcastHandler(req: Request, res: Response): Promise<void> {
  const { subject, body: msgBody, segment } = req.body as { subject: string; body: string; segment: string };
  if (!subject || !msgBody || !segment) throw new HttpError(400, "subject, body and segment required", "VALIDATION_ERROR");
  const data = await sendSuperAdminBroadcast({ subject, body: msgBody, segment, sentBy: req.auth?.userId });
  res.status(200).json(data);
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export async function listTicketsHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const priority = typeof req.query.priority === "string" ? req.query.priority : undefined;
  res.status(200).json(await listSupportTickets({ page, limit, search, status, priority }));
}

export async function getTicketHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  res.status(200).json(await getTicketDetail(id));
}

export async function createTicketHandler(req: Request, res: Response): Promise<void> {
  const { clinicId, subject, priority, message } = req.body as { clinicId: string; subject: string; priority: string; message: string };
  if (!clinicId || !subject || !message) throw new HttpError(400, "clinicId, subject and message required", "VALIDATION_ERROR");
  res.status(201).json(await createTicket({ clinicId, subject, priority: priority ?? "medium", message }));
}

export async function replyTicketHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { message, isStaff } = req.body as { message: string; isStaff?: boolean };
  if (!message) throw new HttpError(400, "message required", "VALIDATION_ERROR");
  res.status(200).json(await replyToTicket(id, { message, isStaff: isStaff ?? true, authorId: req.auth?.userId }));
}

export async function setTicketStatusHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: string };
  if (!status) throw new HttpError(400, "status required", "VALIDATION_ERROR");
  res.status(200).json(await setTicketStatus(id, status));
}

// ── SuperAdmin Accounts ───────────────────────────────────────────────────────

export async function listSuperAdminsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await listSuperAdmins());
}

export async function createSuperAdminHandler(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  if (!name || !email || !password) throw new HttpError(400, "name, email and password required", "VALIDATION_ERROR");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters", "VALIDATION_ERROR");
  res.status(201).json(await createSuperAdmin({ name, email, password }));
}

export async function deleteSuperAdminHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const requesterId = req.auth!.userId;
  res.status(200).json(await deleteSuperAdmin(id, requesterId));
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function listPaymentsHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const clinicId = typeof req.query.clinicId === "string" ? req.query.clinicId : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  res.status(200).json(await listPaymentRecords({ page, limit, clinicId, search }));
}

export async function createPaymentHandler(req: Request, res: Response): Promise<void> {
  const { clinicId, amount, plan, status, description } = req.body as { clinicId: string; amount: number; plan: string; status: string; description?: string };
  if (!clinicId || !amount || !plan || !status) throw new HttpError(400, "clinicId, amount, plan and status required", "VALIDATION_ERROR");
  res.status(201).json(await createPaymentRecord({ clinicId, amount, plan, status, description }));
}

// ── GDPR ──────────────────────────────────────────────────────────────────────

export async function listDeletionRequestsHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  res.status(200).json(await listDeletionRequests({ page, limit, status }));
}

export async function createDeletionRequestHandler(req: Request, res: Response): Promise<void> {
  const { clinicId, reason } = req.body as { clinicId: string; reason?: string };
  if (!clinicId) throw new HttpError(400, "clinicId required", "VALIDATION_ERROR");
  res.status(201).json(await createDeletionRequest({ clinicId, reason, requestedBy: req.auth?.userId }));
}

export async function setDeletionStatusHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: string };
  if (!status) throw new HttpError(400, "status required", "VALIDATION_ERROR");
  res.status(200).json(await setDeletionRequestStatus(id, status));
}

export async function exportClinicDataHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const json = await exportClinicData(id);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="clinic-${id}-data.json"`);
  res.status(200).send(json);
}

// ── System Health ─────────────────────────────────────────────────────────────

export async function getSystemHealthHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await getSystemHealth());
}

// ── API Usage ─────────────────────────────────────────────────────────────────

export async function getApiUsageHandler(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  res.status(200).json(await getApiUsage({ page, limit, search }));
}

// ── Custom Plans ──────────────────────────────────────────────────────────────

export async function listCustomPlansHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await listCustomPlans());
}

export async function createCustomPlanHandler(req: Request, res: Response): Promise<void> {
  const { name, description, price, annualPrice, planId, maxPatients, maxUsers, features, displayFeatures, highlighted, ctaText, sortOrder } = req.body as {
    name: string; description?: string; price: number; annualPrice?: number; planId?: string;
    maxPatients?: number; maxUsers?: number; features?: Record<string, boolean>;
    displayFeatures?: string[]; highlighted?: boolean; ctaText?: string; sortOrder?: number;
  };
  if (!name || price == null) throw new HttpError(400, "name and price required", "VALIDATION_ERROR");
  res.status(201).json(await createCustomPlan({ name, description, price, annualPrice, planId, maxPatients, maxUsers, features: features ?? {}, displayFeatures, highlighted, ctaText, sortOrder }));
}

export async function updateCustomPlanHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  res.status(200).json(await updateCustomPlan(id, req.body));
}

export async function deleteCustomPlanHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  res.status(200).json(await deleteCustomPlan(id));
}
