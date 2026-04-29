import { apiGet, apiPost } from "./api";
import type {
  PrescriptionsListResponse,
  CreatePrescriptionResponse,
} from "./types/prescriptions.types";

const BASE = "/api/prescriptions";

function toQuery(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) qs.set(k, String(v));
  }
  const q = qs.toString();
  return q ? `?${q}` : "";
}

export type GetPrescriptionsQuery = {
  search?: string;
  patientId?: string;
  page?: number;
  limit?: number;
};

export type PrescriptionMedicationInput = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

export type CreatePrescriptionInput = {
  patientId: string;
  doctorId?: string | null;
  date?: string;
  diagnosis: string;
  notes?: string;
  items: PrescriptionMedicationInput[];
};

export async function getPrescriptions(query: GetPrescriptionsQuery = {}) {
  return apiGet<PrescriptionsListResponse>(`${BASE}${toQuery(query as Record<string, string | number | undefined>)}`);
}

export async function createPrescription(input: CreatePrescriptionInput) {
  return apiPost<CreatePrescriptionResponse, CreatePrescriptionInput>(BASE, input);
}
