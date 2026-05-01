import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { normalizeIndianMobile } from "@/utils/phone";
import { geocodeAddress } from "@/utils/geocode";
import { getGroupClinics, resolveRootClinicId } from "@/lib/clinic-locations";
import type { UpdateClinicBody } from "@/schemas/clinic.schemas";

const CLINIC_SELECT = {
  id: true, name: true, slug: true, phone: true,
  address: true, city: true, state: true, pincode: true,
  specialties: true, description: true, logoUrl: true, brandColor: true, createdAt: true,
} as const;

function formatClinic(c: {
  id: string; name: string; slug: string; phone: string;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; specialties: string[]; description: string | null;
  logoUrl: string | null; brandColor: string | null; createdAt: Date;
}) {
  return {
    id: c.id, name: c.name, slug: c.slug, phone: c.phone,
    address: c.address, city: c.city, state: c.state, pincode: c.pincode,
    specialties: c.specialties, description: c.description,
    logoUrl: c.logoUrl, brandColor: c.brandColor,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function getClinicSubscription(clinicId: string) {
  const sub = await prisma.clinicSubscription.findUnique({
    where: { clinicId },
    select: {
      plan: true,
      billingStatus: true,
      trialEndsAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  });

  if (!sub) {
    return {
      plan: "trial",
      billingStatus: "trial",
      trialEndsAt: null,
      daysRemaining: null,
      isTrialExpired: true,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }

  const now = new Date();
  let daysRemaining: number | null = null;
  let isTrialExpired = false;

  if (sub.billingStatus === "trial") {
    if (sub.trialEndsAt) {
      const ms = sub.trialEndsAt.getTime() - now.getTime();
      daysRemaining = ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
      isTrialExpired = ms <= 0;
    } else {
      isTrialExpired = true;
    }
  }

  return {
    plan: sub.plan,
    billingStatus: sub.billingStatus,
    trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
    daysRemaining,
    isTrialExpired,
    currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
  };
}

export async function getClinic(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: CLINIC_SELECT,
  });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  return formatClinic(clinic);
}

// ── Multi-location ────────────────────────────────────────────────────────────

export async function listLocations(clinicId: string) {
  return getGroupClinics(clinicId);
}

export async function createBranch(
  ownerClinicId: string,
  input: { name: string; phone: string; address?: string; city?: string; slug: string },
) {
  const phone = normalizeIndianMobile(input.phone);
  if (!phone) throw new HttpError(400, "Enter a valid Indian mobile number", "INVALID_PHONE");

  const rootId = await resolveRootClinicId(ownerClinicId);

  const existing = await prisma.clinic.findUnique({ where: { slug: input.slug }, select: { id: true } });
  if (existing) throw new HttpError(409, "This clinic URL is already taken", "SLUG_IN_USE");

  const branch = await prisma.clinic.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim().toLowerCase(),
      phone,
      address: input.address?.trim() ?? null,
      city: input.city?.trim() ?? null,
      parentClinicId: rootId,
    },
    select: { id: true, name: true, slug: true, phone: true, city: true, address: true, parentClinicId: true },
  });

  return branch;
}

export async function getLocationSwitchTarget(
  userDbClinicId: string,
  targetClinicId: string,
): Promise<{ id: string; name: string; slug: string }> {
  const group = await getGroupClinics(userDbClinicId);
  const match = group.find((c) => c.id === targetClinicId);
  if (!match) throw new HttpError(403, "You do not have access to that location", "FORBIDDEN");

  const clinic = await prisma.clinic.findUnique({
    where: { id: targetClinicId },
    select: { id: true, name: true, slug: true },
  });
  if (!clinic) throw new HttpError(404, "Location not found", "NOT_FOUND");

  return clinic;
}

// ── Data Export ───────────────────────────────────────────────────────────────

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const escape = (v: string | number | boolean | null | undefined) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
}

export async function exportPatientsCsv(clinicId: string): Promise<string> {
  const patients = await prisma.patient.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, email: true, age: true, gender: true, address: true, nextVisitDate: true, createdAt: true },
  });
  const headers = ["ID", "Name", "Phone", "Email", "Age", "Gender", "Address", "Next Visit Date", "Created At"];
  const rows = patients.map((p) => [
    p.id, p.name, p.phone, p.email ?? "", p.age ?? "", p.gender ?? "",
    p.address ?? "", p.nextVisitDate?.toISOString() ?? "", p.createdAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

export async function exportAppointmentsCsv(clinicId: string): Promise<string> {
  const appointments = await prisma.appointment.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, date: true, startTime: true, endTime: true, reason: true, status: true, createdAt: true,
      patient: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
    },
  });
  const headers = ["ID", "Patient Name", "Patient Phone", "Doctor", "Date", "Start Time", "End Time", "Reason", "Status", "Created At"];
  const rows = appointments.map((a) => [
    a.id, a.patient.name, a.patient.phone, a.doctor?.name ?? "",
    a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date),
    a.startTime, a.endTime, a.reason ?? "", a.status, a.createdAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

export async function exportPrescriptionsCsv(clinicId: string): Promise<string> {
  const prescriptions = await prisma.prescription.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, number: true, date: true, diagnosis: true, notes: true, createdAt: true,
      patient: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
      items: { select: { name: true, dosage: true, frequency: true, duration: true } },
    },
  });
  const headers = ["ID", "Number", "Patient Name", "Patient Phone", "Doctor", "Date", "Diagnosis", "Notes", "Medicines", "Created At"];
  const rows = prescriptions.map((p) => [
    p.id, p.number, p.patient.name, p.patient.phone, p.doctor?.name ?? "",
    p.date.toISOString().slice(0, 10), p.diagnosis ?? "", p.notes ?? "",
    p.items.map((i) => `${i.name} ${i.dosage} ${i.frequency} ${i.duration}`).join("; "),
    p.createdAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

export async function exportInvoicesCsv(clinicId: string): Promise<string> {
  const invoices = await prisma.invoice.findMany({
    where: { clinicId },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true, number: true, total: true, discount: true, gst: true, status: true, issuedAt: true,
      patient: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
      items: { select: { label: true, amount: true } },
    },
  });
  const headers = ["ID", "Invoice No.", "Patient Name", "Patient Phone", "Doctor", "Items", "Discount", "GST", "Total", "Status", "Issued At"];
  const rows = invoices.map((inv) => [
    inv.id, inv.number, inv.patient.name, inv.patient.phone, inv.doctor?.name ?? "",
    inv.items.map((i) => `${i.label}: ₹${i.amount}`).join("; "),
    inv.discount ?? 0, inv.gst ?? 0, inv.total, inv.status, inv.issuedAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

export async function updateClinic(clinicId: string, body: UpdateClinicBody) {
  const existing = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      ...(body.name        !== undefined && { name: body.name }),
      ...(body.phone       !== undefined && { phone: body.phone }),
      ...(body.address     !== undefined && { address: body.address }),
      ...(body.city        !== undefined && { city: body.city }),
      ...(body.state       !== undefined && { state: body.state }),
      ...(body.pincode     !== undefined && { pincode: body.pincode }),
      ...(body.specialties !== undefined && { specialties: body.specialties }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.logoUrl     !== undefined && { logoUrl: body.logoUrl }),
      ...(body.brandColor  !== undefined && { brandColor: body.brandColor }),
    },
    select: CLINIC_SELECT,
  });

  // Geocode in background if location fields changed
  if (body.address !== undefined || body.city !== undefined || body.state !== undefined || body.pincode !== undefined) {
    const parts = [body.address ?? "", body.city ?? "", body.state ?? "", body.pincode ?? ""].filter(Boolean);
    if (parts.length > 0) {
      void geocodeAddress(parts.join(", ")).then((coords) => {
        if (coords) {
          void prisma.clinic.update({
            where: { id: clinicId },
            data: { latitude: coords.lat, longitude: coords.lng },
          });
        }
      });
    }
  }

  return formatClinic(clinic);
}
