import { apiGet, apiPost, apiPatch } from "./api";
import type { PatientResponse, PatientDetailResponse } from "./types/patients.types";

const BASE = "/api/patients";

export type CreatePatientInput = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  age?: number | null;
  gender?: "Male" | "Female" | null;
  nextVisitDate?: string | null;
};

export async function createPatient(input: CreatePatientInput) {
  return apiPost<PatientResponse, CreatePatientInput>(BASE, input);
}

export async function getPatientDetail(patientId: string) {
  return apiGet<PatientDetailResponse>(`${BASE}/${patientId}`);
}

export async function updatePatient(patientId: string, input: Partial<CreatePatientInput>) {
  return apiPatch<PatientResponse, Partial<CreatePatientInput>>(`${BASE}/${patientId}`, input);
}
