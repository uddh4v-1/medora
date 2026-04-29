import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import type { CreateVisitBody } from "@/schemas/visits.schemas";

export async function createVisit(clinicId: string, _userId: string, body: CreateVisitBody) {
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

  const visit = await prisma.visit.create({
    data: {
      clinicId,
      patientId: body.patientId,
      doctorId: body.doctorId ?? null,
      title: body.title,
      reason: body.reason,
      status: "waiting",
      startedAt: new Date(),
    },
  });

  return {
    id: visit.id,
    patientId: visit.patientId,
    patientName: patient.name,
    doctorId: visit.doctorId,
    doctorName: doctor?.name ?? null,
    title: visit.title,
    reason: visit.reason,
    status: "waiting" as const,
    startedAt: visit.startedAt.toISOString(),
  };
}
