import { apiGet, apiPost } from "./api";

const BASE = "/api/audit";

export type ClientAction = "PAGE_VIEW" | "BUTTON_CLICK" | "FORM_SUBMIT" | "CUSTOM";

export type AuditLogItem = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  clinicId: string | null;
  action: string;
  resource: string;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditLogsResponse = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: AuditLogItem[];
};

export type SuperAdminStats = {
  totalClinics: number;
  totalUsers: number;
  totalEvents: number;
  recentEvents: number;
};

export type AuditLogsQuery = {
  page?: number;
  limit?: number;
  userId?: string;
  clinicId?: string;
  action?: string;
  from?: string;
  to?: string;
};

export async function logClientEvent(
  action: ClientAction,
  resource: string,
  metadata?: Record<string, unknown>,
) {
  return apiPost<{ ok: boolean }>(`${BASE}/event`, { action, resource, metadata });
}

export async function getAuditLogs(query: AuditLogsQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.userId) params.set("userId", query.userId);
  if (query.clinicId) params.set("clinicId", query.clinicId);
  if (query.action) params.set("action", query.action);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const qs = params.toString();
  return apiGet<AuditLogsResponse>(`${BASE}/logs${qs ? `?${qs}` : ""}`);
}

export async function getSuperAdminStats() {
  return apiGet<SuperAdminStats>(`${BASE}/stats`);
}
