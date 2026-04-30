import { apiGet, apiPatch } from "./api";

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
};

export async function getClinic() {
  return apiGet<ClinicResponse>(BASE);
}

export async function updateClinic(input: UpdateClinicInput) {
  return apiPatch<ClinicResponse, UpdateClinicInput>(BASE, input);
}
