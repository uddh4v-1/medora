import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { assertPatientLimit } from "@/lib/plan-limits";
import type { CreatePatientBody, UpdatePatientBody } from "@/schemas/patients.schemas";

function yyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function asDateStart(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export async function createPatient(clinicId: string, body: CreatePatientBody) {
  await assertPatientLimit(clinicId);

  const patient = await prisma.patient.create({
    data: {
      clinicId,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      address: body.address || null,
      age: body.age ?? null,
      gender: body.gender ?? null,
      nextVisitDate: body.nextVisitDate ? asDateStart(body.nextVisitDate) : null,
    },
  });

  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    age: patient.age,
    gender: patient.gender,
    nextVisitDate: patient.nextVisitDate ? yyyyMmDd(patient.nextVisitDate) : null,
    createdAt: patient.createdAt.toISOString(),
  };
}

export async function getPatientById(clinicId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    include: {
      visits: {
        orderBy: { startedAt: "desc" },
        take: 20,
        include: {
          doctor: { select: { id: true, name: true } },
        },
      },
      appointments: {
        orderBy: { date: "desc" },
        take: 20,
        include: {
          doctor: { select: { id: true, name: true } },
        },
      },
      prescriptions: {
        orderBy: { date: "desc" },
        take: 20,
        include: {
          doctor: { select: { id: true, name: true } },
          items: true,
        },
      },
      invoices: {
        orderBy: { issuedAt: "desc" },
        take: 20,
        include: {
          doctor: { select: { id: true, name: true } },
          items: true,
        },
      },
    },
  });

  if (!patient) throw new HttpError(404, "Patient not found", "NOT_FOUND");

  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    age: patient.age,
    gender: patient.gender,
    nextVisitDate: patient.nextVisitDate ? yyyyMmDd(patient.nextVisitDate) : null,
    createdAt: patient.createdAt.toISOString(),
    visits: patient.visits.map((v) => ({
      id: v.id,
      title: v.title,
      reason: v.reason,
      status: v.status === "in_progress" ? "in-progress" : v.status,
      startedAt: v.startedAt.toISOString(),
      doctorName: v.doctor?.name ?? null,
    })),
    appointments: patient.appointments.map((a) => ({
      id: a.id,
      date: yyyyMmDd(a.date),
      startTime: a.startTime,
      endTime: a.endTime,
      reason: a.reason,
      status:
        a.status === "in_progress"
          ? "in-progress"
          : a.status === "no_show"
            ? "no-show"
            : a.status,
      doctorName: a.doctor?.name ?? null,
    })),
    prescriptions: patient.prescriptions.map((rx) => ({
      id: rx.id,
      number: rx.number,
      date: yyyyMmDd(rx.date),
      diagnosis: rx.diagnosis,
      notes: rx.notes,
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
    invoices: patient.invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      total: inv.total,
      status: inv.status,
      discount: inv.discount,
      gst: inv.gst,
      issuedAt: yyyyMmDd(inv.issuedAt),
      doctorName: inv.doctor?.name ?? null,
      items: inv.items.map((i) => ({ id: i.id, label: i.label, amount: i.amount })),
    })),
  };
}

export async function updatePatient(
  clinicId: string,
  patientId: string,
  body: UpdatePatientBody,
) {
  const existing = await prisma.patient.findFirst({
    where: { id: patientId, clinicId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Patient not found", "NOT_FOUND");

  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.address !== undefined && { address: body.address || null }),
      ...(body.age !== undefined && { age: body.age }),
      ...(body.gender !== undefined && { gender: body.gender }),
      ...(body.nextVisitDate !== undefined && {
        nextVisitDate: body.nextVisitDate ? asDateStart(body.nextVisitDate) : null,
      }),
    },
  });

  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    age: patient.age,
    gender: patient.gender,
    nextVisitDate: patient.nextVisitDate ? yyyyMmDd(patient.nextVisitDate) : null,
    createdAt: patient.createdAt.toISOString(),
  };
}
