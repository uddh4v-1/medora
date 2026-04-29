import { apiGet, apiPatch } from "./api";
import type {
  DashboardInvoicesResponse,
  DashboardOverviewResponse,
  DashboardPatientsResponse,
  DashboardQueueResponse,
} from "./types/dashboard.types";

const DASHBOARD_BASE = "/api/dashboard";

type ListQuery = {
  page?: number;
  limit?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    qs.set(k, String(v));
  }
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export async function getDashboardOverview() {
  return apiGet<DashboardOverviewResponse>(`${DASHBOARD_BASE}/overview`);
}

export async function getDashboardPatients(
  query: ListQuery & { search?: string } = {},
) {
  return apiGet<DashboardPatientsResponse>(
    `${DASHBOARD_BASE}/patients${toQuery(query)}`,
  );
}

export async function getDashboardQueue(query: { status?: string } = {}) {
  return apiGet<DashboardQueueResponse>(
    `${DASHBOARD_BASE}/queue${toQuery(query)}`,
  );
}

export async function patchDashboardQueueStatus(
  visitId: string,
  status: "waiting" | "in-progress" | "completed",
) {
  return apiPatch<{ ok: boolean }, { status: string }>(
    `${DASHBOARD_BASE}/queue/${visitId}/status`,
    { status },
  );
}

export async function getDashboardInvoices(
  query: ListQuery & { status?: "paid" | "unpaid" } = {},
) {
  return apiGet<DashboardInvoicesResponse>(
    `${DASHBOARD_BASE}/invoices${toQuery(query)}`,
  );
}
