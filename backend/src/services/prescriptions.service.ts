import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import type {
  CreatePrescriptionBody,
  PrescriptionsQuery,
} from "@/schemas/prescriptions.schemas";

function yyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function asDateStart(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function pageMeta(total: number, page: number, limit: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

async function nextPrescriptionNumber(clinicId: string): Promise<string> {
  const last = await prisma.prescription.findFirst({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  const highest = last
    ? (Number.parseInt(last.number.replace(/^RX-/, ""), 10) || 0)
    : 0;
  return `RX-${(highest + 1).toString().padStart(5, "0")}`;
}

export async function fetchPrescriptions(clinicId: string, query: PrescriptionsQuery) {
  const { page, limit, search, patientId } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { clinicId };
  if (patientId) where.patientId = patientId;
  if (search?.trim()) {
    const q = search.trim();
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { diagnosis: { contains: q, mode: "insensitive" } },
      { patient: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
        items: true,
      },
    }),
    prisma.prescription.count({ where }),
  ]);

  return {
    items: rows.map((rx) => ({
      id: rx.id,
      number: rx.number,
      date: yyyyMmDd(rx.date),
      diagnosis: rx.diagnosis,
      notes: rx.notes,
      patientId: rx.patientId,
      patientName: rx.patient.name,
      doctorId: rx.doctorId,
      doctorName: rx.doctor?.name ?? null,
      items: rx.items.map((i) => ({
        id: i.id,
        name: i.name,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        notes: i.notes,
      })),
    })),
    ...pageMeta(total, page, limit),
  };
}

export async function createPrescription(
  clinicId: string,
  body: CreatePrescriptionBody,
) {
  const patient = await prisma.patient.findFirst({
    where: { id: body.patientId, clinicId },
    select: { id: true, name: true },
  });
  if (!patient) throw new HttpError(404, "Patient not found", "NOT_FOUND");

  let doctor: { id: string; name: string } | null = null;
  if (body.doctorId) {
    const doc = await prisma.user.findFirst({
      where: { id: body.doctorId, clinicId },
      select: { id: true, name: true },
    });
    if (!doc) throw new HttpError(404, "Doctor not found", "NOT_FOUND");
    doctor = doc;
  }

  const number = await nextPrescriptionNumber(clinicId);
  const date = body.date ? asDateStart(body.date) : new Date();

  const rx = await prisma.prescription.create({
    data: {
      clinicId,
      patientId: body.patientId,
      doctorId: body.doctorId ?? null,
      number,
      date,
      diagnosis: body.diagnosis,
      notes: body.notes ?? null,
      items: {
        create: body.items.map((i) => ({
          name: i.name,
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration,
          notes: i.notes ?? null,
        })),
      },
    },
    include: { items: true },
  });

  return {
    id: rx.id,
    number: rx.number,
    date: yyyyMmDd(rx.date),
    diagnosis: rx.diagnosis,
    notes: rx.notes,
    patientId: rx.patientId,
    patientName: patient.name,
    doctorId: rx.doctorId,
    doctorName: doctor?.name ?? null,
    items: rx.items.map((i) => ({
      id: i.id,
      name: i.name,
      dosage: i.dosage,
      frequency: i.frequency,
      duration: i.duration,
      notes: i.notes,
    })),
  };
}

export async function getPrescriptionById(clinicId: string, prescriptionId: string) {
  const rx = await prisma.prescription.findFirst({
    where: { id: prescriptionId, clinicId },
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
      items: true,
    },
  });

  if (!rx) throw new HttpError(404, "Prescription not found", "NOT_FOUND");

  return {
    id: rx.id,
    number: rx.number,
    date: yyyyMmDd(rx.date),
    diagnosis: rx.diagnosis,
    notes: rx.notes,
    patientId: rx.patientId,
    patientName: rx.patient.name,
    doctorId: rx.doctorId,
    doctorName: rx.doctor?.name ?? null,
    items: rx.items.map((i) => ({
      id: i.id,
      name: i.name,
      dosage: i.dosage,
      frequency: i.frequency,
      duration: i.duration,
      notes: i.notes,
    })),
  };
}
