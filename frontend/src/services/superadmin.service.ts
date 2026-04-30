import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import type {
  ClinicDetail, ClinicListResponse, SetClinicStatusResponse,
  UserListResponse, SetUserStatusResponse, ImpersonateClinicResponse,
  AnalyticsData, ClinicFlagsListResponse, PlatformConfigData,
  BillingListResponse, BillingStatus, BillingPlan,
  FinancialDashboard, ClinicHealthResponse, RiskLevel,
  OnboardingResponse, BroadcastListResponse, BroadcastItem,
  TicketListResponse, TicketDetail,
  SuperAdminAccount, PaymentListResponse, PaymentItem,
  DeletionRequestListResponse, DeletionRequestItem,
  SystemHealth, ApiUsageResponse, CustomPlan,
} from "./types/superadmin.types";

const BASE = "/api/superadmin";

export interface ListClinicsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "suspended";
}

export function listClinics(params: ListClinicsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiGet<ClinicListResponse>(`${BASE}/clinics${qs ? `?${qs}` : ""}`);
}

export function getClinicDetail(clinicId: string) {
  return apiGet<ClinicDetail>(`${BASE}/clinics/${clinicId}`);
}

export function setClinicStatus(clinicId: string, status: "active" | "suspended") {
  return apiPatch<SetClinicStatusResponse, { status: "active" | "suspended" }>(
    `${BASE}/clinics/${clinicId}/status`,
    { status },
  );
}

export function deleteClinic(clinicId: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/clinics/${clinicId}`);
}

// ── Users ────────────────────────────────────────────────────────────────────

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: "Owner" | "Doctor" | "Receptionist";
  status?: "active" | "suspended";
}

export function listUsers(params: ListUsersParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.role) q.set("role", params.role);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiGet<UserListResponse>(`${BASE}/users${qs ? `?${qs}` : ""}`);
}

export function setUserStatus(userId: string, status: "active" | "suspended") {
  return apiPatch<SetUserStatusResponse, { status: "active" | "suspended" }>(
    `${BASE}/users/${userId}/status`,
    { status },
  );
}

export function forcePasswordReset(userId: string) {
  return apiPost<{ ok: boolean }, Record<string, never>>(
    `${BASE}/users/${userId}/force-reset`,
    {},
  );
}

export function verifyUserEmail(userId: string) {
  return apiPatch<{ ok: boolean }, Record<string, never>>(
    `${BASE}/users/${userId}/verify-email`,
    {},
  );
}

// ── Impersonation ─────────────────────────────────────────────────────────────

export function impersonateClinic(clinicId: string) {
  return apiPost<ImpersonateClinicResponse, Record<string, never>>(
    `${BASE}/clinics/${clinicId}/impersonate`,
    {},
  );
}

export function exitImpersonation() {
  return apiPost<{ ok: boolean }, Record<string, never>>(
    `${BASE}/exit-impersonation`,
    {},
  );
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function getAnalytics() {
  return apiGet<AnalyticsData>(`${BASE}/analytics`);
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export interface ListClinicFlagsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function listClinicFlags(params: ListClinicFlagsParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiGet<ClinicFlagsListResponse>(`${BASE}/config/flags${qs ? `?${qs}` : ""}`);
}

export function updateClinicFlags(
  clinicId: string,
  flags: { publicBooking?: boolean; whatsappNotifications?: boolean },
) {
  return apiPatch<{ clinicId: string; flags: { publicBooking: boolean; whatsappNotifications: boolean } }, typeof flags>(
    `${BASE}/config/flags/${clinicId}`,
    flags,
  );
}

export function getPlatformConfig() {
  return apiGet<PlatformConfigData>(`${BASE}/config/platform`);
}

export function updatePlatformConfig(
  data: { maintenanceMode?: boolean; bannerMessage?: string | null },
) {
  return apiPatch<PlatformConfigData, typeof data>(`${BASE}/config/platform`, data);
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface ListBillingParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: BillingStatus;
}

export function listBilling(params: ListBillingParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiGet<BillingListResponse>(`${BASE}/billing${qs ? `?${qs}` : ""}`);
}

export function extendTrial(clinicId: string, days: number) {
  return apiPatch<{ clinicId: string; trialEndsAt: string | null }, { days: number }>(
    `${BASE}/billing/${clinicId}/extend-trial`,
    { days },
  );
}

export function setBillingStatus(
  clinicId: string,
  status: BillingStatus,
  plan?: BillingPlan,
) {
  return apiPatch<{ clinicId: string; billingStatus: BillingStatus }, { status: BillingStatus; plan?: BillingPlan }>(
    `${BASE}/billing/${clinicId}/status`,
    { status, ...(plan ? { plan } : {}) },
  );
}

// ── Bulk Operations ───────────────────────────────────────────────────────────

export function bulkClinicAction(ids: string[], action: "activate" | "suspend" | "delete") {
  return apiPost<{ affected: number }, { ids: string[]; action: string }>(
    `${BASE}/clinics/bulk`,
    { ids, action },
  );
}

export function bulkPlanChange(ids: string[], plan: string, billingStatus: string) {
  return apiPost<{ affected: number }, { ids: string[]; plan: string; billingStatus: string }>(
    `${BASE}/billing/bulk-plan`,
    { ids, plan, billingStatus },
  );
}

// ── Financial Dashboard ───────────────────────────────────────────────────────

export function getFinancialDashboard() {
  return apiGet<FinancialDashboard>(`${BASE}/financial`);
}

// ── Clinic Health Scores ──────────────────────────────────────────────────────

export interface ListHealthScoresParams {
  page?: number;
  limit?: number;
  search?: string;
  risk?: RiskLevel | "all";
}

export function listHealthScores(params: ListHealthScoresParams = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.risk) q.set("risk", params.risk);
  const qs = q.toString();
  return apiGet<ClinicHealthResponse>(`${BASE}/health-scores${qs ? `?${qs}` : ""}`);
}

// ── Data Export ───────────────────────────────────────────────────────────────

export function downloadExport(type: "clinics" | "users" | "audit-logs") {
  window.open(`${BASE}/export/${type}`, "_blank");
}

export function downloadClinicData(clinicId: string) {
  window.open(`${BASE}/export/clinic/${clinicId}`, "_blank");
}

// ── Onboarding ────────────────────────────────────────────────────────────────

export function getOnboarding(params: { page?: number; limit?: number; search?: string } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiGet<OnboardingResponse>(`${BASE}/onboarding${qs ? `?${qs}` : ""}`);
}

// ── Broadcasts ────────────────────────────────────────────────────────────────

export function listBroadcasts(params: { page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiGet<BroadcastListResponse>(`${BASE}/broadcasts${qs ? `?${qs}` : ""}`);
}

export function sendBroadcast(data: { subject: string; body: string; segment: string }) {
  return apiPost<{ id: string; delivered: number; recipientCount: number }, typeof data>(
    `${BASE}/broadcasts`, data,
  );
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export function listTickets(params: { page?: number; limit?: number; search?: string; status?: string; priority?: string } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.priority) q.set("priority", params.priority);
  const qs = q.toString();
  return apiGet<TicketListResponse>(`${BASE}/tickets${qs ? `?${qs}` : ""}`);
}

export function getTicket(id: string) {
  return apiGet<TicketDetail>(`${BASE}/tickets/${id}`);
}

export function createTicket(data: { clinicId: string; subject: string; priority: string; message: string }) {
  return apiPost<TicketDetail, typeof data>(`${BASE}/tickets`, data);
}

export function replyTicket(id: string, message: string) {
  return apiPost<{ id: string }, { message: string; isStaff: boolean }>(
    `${BASE}/tickets/${id}/reply`, { message, isStaff: true },
  );
}

export function setTicketStatus(id: string, status: string) {
  return apiPatch<{ id: string; status: string }, { status: string }>(
    `${BASE}/tickets/${id}/status`, { status },
  );
}

// ── SuperAdmin Accounts ───────────────────────────────────────────────────────

export function listSuperAdmins() {
  return apiGet<SuperAdminAccount[]>(`${BASE}/admins`);
}

export function createSuperAdmin(data: { name: string; email: string; password: string }) {
  return apiPost<SuperAdminAccount, typeof data>(`${BASE}/admins`, data);
}

export function deleteSuperAdmin(id: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/admins/${id}`);
}

// ── Payments ──────────────────────────────────────────────────────────────────

export function listPayments(params: { page?: number; limit?: number; clinicId?: string; search?: string } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.clinicId) q.set("clinicId", params.clinicId);
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiGet<PaymentListResponse>(`${BASE}/payments${qs ? `?${qs}` : ""}`);
}

export function createPayment(data: { clinicId: string; amount: number; plan: string; status: string; description?: string }) {
  return apiPost<PaymentItem, typeof data>(`${BASE}/payments`, data);
}

// ── GDPR ──────────────────────────────────────────────────────────────────────

export function listDeletionRequests(params: { page?: number; limit?: number; status?: string } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiGet<DeletionRequestListResponse>(`${BASE}/gdpr/requests${qs ? `?${qs}` : ""}`);
}

export function createDeletionRequest(data: { clinicId: string; reason?: string }) {
  return apiPost<DeletionRequestItem, typeof data>(`${BASE}/gdpr/requests`, data);
}

export function setDeletionRequestStatus(id: string, status: string) {
  return apiPatch<DeletionRequestItem, { status: string }>(`${BASE}/gdpr/requests/${id}/status`, { status });
}

// ── System Health ─────────────────────────────────────────────────────────────

export function getSystemHealth() {
  return apiGet<SystemHealth>(`${BASE}/system-health`);
}

// ── API Usage ─────────────────────────────────────────────────────────────────

export function getApiUsage(params: { page?: number; limit?: number; search?: string } = {}) {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.limit) q.set("limit", String(params.limit));
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiGet<ApiUsageResponse>(`${BASE}/api-usage${qs ? `?${qs}` : ""}`);
}

// ── Custom Plans ──────────────────────────────────────────────────────────────

export function listCustomPlans() {
  return apiGet<CustomPlan[]>(`${BASE}/custom-plans`);
}

export function createCustomPlan(data: { name: string; description?: string; price: number; maxPatients?: number; maxUsers?: number; features?: Record<string, boolean> }) {
  return apiPost<CustomPlan, typeof data>(`${BASE}/custom-plans`, data);
}

export function updateCustomPlan(id: string, data: Partial<CustomPlan>) {
  return apiPatch<CustomPlan, typeof data>(`${BASE}/custom-plans/${id}`, data);
}

export function deleteCustomPlan(id: string) {
  return apiDelete<{ ok: boolean }>(`${BASE}/custom-plans/${id}`);
}
