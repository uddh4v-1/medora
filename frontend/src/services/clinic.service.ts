import { apiGet, apiPatch } from "./api";

const BASE = "/api/clinic";

export type ClinicResponse = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  createdAt: string;
};

export async function getClinic() {
  return apiGet<ClinicResponse>(BASE);
}

export async function updateClinic(input: { name?: string; phone?: string }) {
  return apiPatch<ClinicResponse, typeof input>(BASE, input);
}
