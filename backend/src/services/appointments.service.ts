import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import type {
  AppointmentsQuery,
  CreateAppointmentBody,
  UpdateAppointmentStatusBody,
} from "@/schemas/appointments.schemas";

type DbAppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

function toDbStatus(s: string): DbAppointmentStatus {
  if (s === "in-progress") return "in_progress";
  if (s === "no-show") return "no_show";
  return s as DbAppointmentStatus;
}

function toApiStatus(s: DbAppointmentStatus): string {
  if (s === "in_progress") return "in-progress";
  if (s === "no_show") return "no-show";
  return s;
}

function yyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function asDateStart(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function asDateEnd(iso: string): Date {
  return new Date(`${iso}T23:59:59.999Z`);
}

export async function fetchAppointments(clinicId: string, query: AppointmentsQuery) {
  const where: Record<string, unknown> = { clinicId };

  if (query.patientId) {
    where.patientId = query.patientId;
  }

  if (query.date) {
    where.date = { gte: asDateStart(query.date), lte: asDateEnd(query.date) };
  } else if (query.from || query.to) {
    const from = query.from ? asDateStart(query.from) : new Date(0);
    const to = query.to ? asDateEnd(query.to) : new Date("2099-12-31");
    where.date = { gte: from, lte: to };
  }

  const rows = await prisma.appointment.findMany({
    where,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return {
    items: rows.map((a) => ({
      id: a.id,
      date: yyyyMmDd(a.date),
      startTime: a.startTime,
      endTime: a.endTime,
      reason: a.reason,
      status: toApiStatus(a.status),
      patientId: a.patientId,
      patientName: a.patient.name,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name ?? null,
    })),
  };
}

export async function createAppointment(
  clinicId: string,
  body: CreateAppointmentBody,
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

  const appt = await prisma.appointment.create({
    data: {
      clinicId,
      patientId: body.patientId,
      doctorId: body.doctorId ?? null,
      date: asDateStart(body.date),
      startTime: body.startTime,
      endTime: body.endTime,
      reason: body.reason,
      status: "scheduled",
    },
  });

  return {
    id: appt.id,
    date: yyyyMmDd(appt.date),
    startTime: appt.startTime,
    endTime: appt.endTime,
    reason: appt.reason,
    status: "scheduled" as const,
    patientId: appt.patientId,
    patientName: patient.name,
    doctorId: appt.doctorId,
    doctorName: doctor?.name ?? null,
  };
}

export async function updateAppointmentStatus(
  clinicId: string,
  appointmentId: string,
  body: UpdateAppointmentStatusBody,
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, clinicId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Appointment not found", "NOT_FOUND");

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: toDbStatus(body.status) },
  });
}
