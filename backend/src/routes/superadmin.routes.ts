import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireSuperAdmin } from "@/middleware/require-superadmin.middleware";
import {
  createImpersonationRequestHandler,
  listMyImpersonationRequestsHandler,
  consumeImpersonationRequestHandler,
} from "@/controllers/impersonation-requests.controller";
import {
  listClinicsHandler,
  getClinicDetailHandler,
  setClinicStatusHandler,
  deleteClinicHandler,
  listUsersHandler,
  setUserStatusHandler,
  forcePasswordResetHandler,
  verifyUserEmailHandler,
  impersonateClinicHandler,
  exitImpersonationHandler,
  getAnalyticsHandler,
  listClinicFlagsHandler,
  updateClinicFlagsHandler,
  getPlatformConfigHandler,
  updatePlatformConfigHandler,
  listBillingHandler,
  extendTrialHandler,
  setBillingStatusHandler,
  getFinancialDashboardHandler,
  getClinicHealthScoresHandler,
  exportClinicsHandler,
  exportUsersHandler,
  exportAuditLogsHandler,
  bulkClinicActionHandler,
  bulkPlanChangeHandler,
  getOnboardingHandler,
  listBroadcastsHandler,
  sendBroadcastHandler,
  listTicketsHandler,
  getTicketHandler,
  createTicketHandler,
  replyTicketHandler,
  setTicketStatusHandler,
  listSuperAdminsHandler,
  createSuperAdminHandler,
  deleteSuperAdminHandler,
  listPaymentsHandler,
  createPaymentHandler,
  listDeletionRequestsHandler,
  createDeletionRequestHandler,
  setDeletionStatusHandler,
  exportClinicDataHandler,
  getSystemHealthHandler,
  getApiUsageHandler,
  listCustomPlansHandler,
  createCustomPlanHandler,
  updateCustomPlanHandler,
  deleteCustomPlanHandler,
} from "@/controllers/superadmin.controller";

export const superadminRouter = Router();

// Must be before requireSuperAdmin — during impersonation the JWT role is "Owner", not "SuperAdmin"
superadminRouter.post("/exit-impersonation", asyncHandler(exitImpersonationHandler));

superadminRouter.use(requireSuperAdmin);

// Clinics
superadminRouter.get("/clinics", asyncHandler(listClinicsHandler));
superadminRouter.get("/clinics/:id", asyncHandler(getClinicDetailHandler));
superadminRouter.patch("/clinics/:id/status", asyncHandler(setClinicStatusHandler));
superadminRouter.delete("/clinics/:id", asyncHandler(deleteClinicHandler));
superadminRouter.post("/clinics/:id/impersonate", asyncHandler(impersonateClinicHandler));
superadminRouter.post("/clinics/bulk", asyncHandler(bulkClinicActionHandler));

// Impersonation requests (consent-based flow)
superadminRouter.post(
  "/clinics/:id/impersonation-requests",
  asyncHandler(createImpersonationRequestHandler),
);
superadminRouter.get(
  "/impersonation-requests",
  asyncHandler(listMyImpersonationRequestsHandler),
);
superadminRouter.post(
  "/impersonation-requests/:id/consume",
  asyncHandler(consumeImpersonationRequestHandler),
);

// Users
superadminRouter.get("/users", asyncHandler(listUsersHandler));
superadminRouter.patch("/users/:id/status", asyncHandler(setUserStatusHandler));
superadminRouter.post("/users/:id/force-reset", asyncHandler(forcePasswordResetHandler));
superadminRouter.patch("/users/:id/verify-email", asyncHandler(verifyUserEmailHandler));

// Analytics
superadminRouter.get("/analytics", asyncHandler(getAnalyticsHandler));
superadminRouter.get("/financial", asyncHandler(getFinancialDashboardHandler));
superadminRouter.get("/health-scores", asyncHandler(getClinicHealthScoresHandler));
superadminRouter.get("/system-health", asyncHandler(getSystemHealthHandler));
superadminRouter.get("/api-usage", asyncHandler(getApiUsageHandler));
superadminRouter.get("/onboarding", asyncHandler(getOnboardingHandler));

// Config
superadminRouter.get("/config/flags", asyncHandler(listClinicFlagsHandler));
superadminRouter.patch("/config/flags/:id", asyncHandler(updateClinicFlagsHandler));
superadminRouter.get("/config/platform", asyncHandler(getPlatformConfigHandler));
superadminRouter.patch("/config/platform", asyncHandler(updatePlatformConfigHandler));

// Billing
superadminRouter.get("/billing", asyncHandler(listBillingHandler));
superadminRouter.patch("/billing/:id/extend-trial", asyncHandler(extendTrialHandler));
superadminRouter.patch("/billing/:id/status", asyncHandler(setBillingStatusHandler));
superadminRouter.post("/billing/bulk-plan", asyncHandler(bulkPlanChangeHandler));

// Payments
superadminRouter.get("/payments", asyncHandler(listPaymentsHandler));
superadminRouter.post("/payments", asyncHandler(createPaymentHandler));

// Export
superadminRouter.get("/export/clinics", asyncHandler(exportClinicsHandler));
superadminRouter.get("/export/users", asyncHandler(exportUsersHandler));
superadminRouter.get("/export/audit-logs", asyncHandler(exportAuditLogsHandler));
superadminRouter.get("/export/clinic/:id", asyncHandler(exportClinicDataHandler));

// Broadcasts
superadminRouter.get("/broadcasts", asyncHandler(listBroadcastsHandler));
superadminRouter.post("/broadcasts", asyncHandler(sendBroadcastHandler));

// Support Tickets
superadminRouter.get("/tickets", asyncHandler(listTicketsHandler));
superadminRouter.post("/tickets", asyncHandler(createTicketHandler));
superadminRouter.get("/tickets/:id", asyncHandler(getTicketHandler));
superadminRouter.post("/tickets/:id/reply", asyncHandler(replyTicketHandler));
superadminRouter.patch("/tickets/:id/status", asyncHandler(setTicketStatusHandler));

// SuperAdmin Accounts
superadminRouter.get("/admins", asyncHandler(listSuperAdminsHandler));
superadminRouter.post("/admins", asyncHandler(createSuperAdminHandler));
superadminRouter.delete("/admins/:id", asyncHandler(deleteSuperAdminHandler));

// GDPR
superadminRouter.get("/gdpr/requests", asyncHandler(listDeletionRequestsHandler));
superadminRouter.post("/gdpr/requests", asyncHandler(createDeletionRequestHandler));
superadminRouter.patch("/gdpr/requests/:id/status", asyncHandler(setDeletionStatusHandler));

// Custom Plans
superadminRouter.get("/custom-plans", asyncHandler(listCustomPlansHandler));
superadminRouter.post("/custom-plans", asyncHandler(createCustomPlanHandler));
superadminRouter.patch("/custom-plans/:id", asyncHandler(updateCustomPlanHandler));
superadminRouter.delete("/custom-plans/:id", asyncHandler(deleteCustomPlanHandler));
