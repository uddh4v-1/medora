import { apiGet, apiPatch } from "./api";

export type RevenueSummaryResponse = {
  range: { from: string; to: string };
  series: { date: string; amount: number }[];
  totals: { today: number; thisPeriod: number; collected: number; outstanding: number };
  outstandingInvoices: { id: string; number: string; patientName: string; total: number }[];
};

export type ReportsOverviewResponse = {
  range: { from: string; to: string };
  topMedications: { name: string; count: number }[];
  noShow: { count: number; total: number; ratePercent: number | null };
  doctorUtilization: { name: string; appointmentCount: number }[];
  appointmentsTrend: { date: string; count: number }[];
};
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

export async function getRevenueSummary(from: string, to: string) {
  return apiGet<RevenueSummaryResponse>(
    `${DASHBOARD_BASE}/revenue/summary${toQuery({ from, to })}`,
  );
}

export async function getReportsOverview(from: string, to: string) {
  return apiGet<ReportsOverviewResponse>(
    `${DASHBOARD_BASE}/reports${toQuery({ from, to })}`,
  );
}
