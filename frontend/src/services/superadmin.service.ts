import { apiDelete, apiGet, apiPatch, apiPost } from "./api";
import type {
  ClinicDetail,
  ClinicListResponse,
  SetClinicStatusResponse,
  UserListResponse,
  SetUserStatusResponse,
  ImpersonateClinicResponse,
  AnalyticsData,
  ClinicFlagsListResponse,
  PlatformConfigData,
  BillingListResponse,
  BillingStatus,
  BillingPlan,
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
