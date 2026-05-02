import { apiGet, apiPatch, apiPost } from "./api";

const BASE = "/api/clinic";

export type ClinicResponse = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  specialties: string[];
  description: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  createdAt: string;
};

export type UpdateClinicInput = {
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  specialties?: string[];
  description?: string;
  logoUrl?: string | null;
  brandColor?: string | null;
};

export async function getClinic() {
  return apiGet<ClinicResponse>(BASE);
}

export async function updateClinic(input: UpdateClinicInput) {
  return apiPatch<ClinicResponse, UpdateClinicInput>(BASE, input);
}

// ── Multi-location ────────────────────────────────────────────────────────────

export type LocationSummary = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  city: string | null;
  address: string | null;
  parentClinicId: string | null;
};

export type CreateBranchInput = {
  name: string;
  phone: string;
  slug: string;
  address?: string;
  city?: string;
};

export async function getLocations() {
  return apiGet<{ locations: LocationSummary[] }>(`${BASE}/locations`);
}

export async function createBranch(input: CreateBranchInput) {
  return apiPost<{ branch: LocationSummary }, CreateBranchInput>(`${BASE}/locations`, input);
}

// ── Data Export ───────────────────────────────────────────────────────────────

export type ExportType = "patients" | "appointments" | "prescriptions" | "invoices";

import { getApiBaseUrl } from "./api";

export async function downloadClinicExport(type: ExportType): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${BASE}/export?type=${type}`, { credentials: "include" });
    if (!res.ok) return { ok: false, error: `Server error: ${res.status}` };
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { ok: true };
  } catch {
    return { ok: false, error: "Download failed" };
  }
}

export async function switchLocation(targetClinicId: string) {
  return apiPost<{ clinic: { id: string; name: string; slug: string } }, { targetClinicId: string }>(
    `${BASE}/locations/switch`,
    { targetClinicId },
  );
}

// ── Multi-clinic (user-owned) ─────────────────────────────────────────────────

export type OwnedClinicSummary = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  multiClinicEnabled: boolean;
};

export type CreateClinicInput = {
  clinicName: string;
  phone: string;
  slug: string;
};

export async function getUserClinics() {
  return apiGet<{ clinics: OwnedClinicSummary[] }>(`${BASE}/my-clinics`);
}

export async function createUserClinic(input: CreateClinicInput) {
  return apiPost<{ clinic: { id: string; name: string; slug: string } }, CreateClinicInput>(
    `${BASE}/my-clinics`,
    input,
  );
}
