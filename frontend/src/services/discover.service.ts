import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4100";

export type ClinicCard = {
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
  doctorCount: number;
  distanceKm?: number;
};

export type PublicClinic = {
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
  doctors: { id: string; name: string }[];
};

export type PublicBookingInput = {
  name: string;
  phone: string;
  reason?: string;
  doctorId?: string | null;
  date: string;
  startTime: string;
  endTime: string;
};

export type PublicAppointmentResult = {
  id: string;
  patientName: string;
  doctorName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
};

export async function searchClinics(params: {
  name?: string;
  city?: string;
  pincode?: string;
  specialty?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}): Promise<ClinicCard[]> {
  const { data } = await axios.get<{ clinics: ClinicCard[] }>(
    `${API_URL}/api/discover/clinics`,
    { params },
  );
  return data.clinics;
}

export async function getClinicBySlug(slug: string): Promise<PublicClinic | null> {
  try {
    const { data, status } = await axios.get<{ clinic: PublicClinic }>(
      `${API_URL}/api/discover/clinics/${encodeURIComponent(slug)}`,
    );
    if (status !== 200) return null;
    return data.clinic;
  } catch {
    return null;
  }
}

export async function createPublicBookingAppointment(
  slug: string,
  input: PublicBookingInput,
): Promise<PublicAppointmentResult | null> {
  try {
    const { data, status } = await axios.post<{ appointment: PublicAppointmentResult }>(
      `${API_URL}/api/discover/clinics/${encodeURIComponent(slug)}/appointments`,
      input,
    );
    if (status !== 201) return null;
    return data.appointment;
  } catch {
    return null;
  }
}
