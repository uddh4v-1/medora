import { apiGet, apiPost, apiPatch } from "./api";
import type {
  AppointmentsListResponse,
  CreateAppointmentResponse,
} from "./types/appointments.types";

const BASE = "/api/appointments";

function toQuery(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, v);
  }
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export type GetAppointmentsQuery = {
  date?: string;
  from?: string;
  to?: string;
  patientId?: string;
};

export type CreateAppointmentInput = {
  patientId: string;
  doctorId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export async function getAppointments(query: GetAppointmentsQuery = {}) {
  return apiGet<AppointmentsListResponse>(`${BASE}${toQuery(query as Record<string, string | undefined>)}`);
}

export async function createAppointment(input: CreateAppointmentInput) {
  return apiPost<CreateAppointmentResponse, CreateAppointmentInput>(BASE, input);
}

export async function patchAppointmentStatus(
  appointmentId: string,
  status: "scheduled" | "confirmed" | "in-progress" | "completed" | "cancelled" | "no-show",
) {
  return apiPatch<{ ok: boolean }, { status: string }>(
    `${BASE}/${appointmentId}/status`,
    { status },
  );
}
