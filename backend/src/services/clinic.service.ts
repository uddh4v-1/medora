import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import type { UpdateClinicBody } from "@/schemas/clinic.schemas";

export async function getClinic(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, slug: true, phone: true, createdAt: true },
  });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  return {
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    phone: clinic.phone,
    createdAt: clinic.createdAt.toISOString(),
  };
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
      ...(body.name !== undefined && { name: body.name }),
      ...(body.phone !== undefined && { phone: body.phone }),
    },
    select: { id: true, name: true, slug: true, phone: true, createdAt: true },
  });

  return {
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    phone: clinic.phone,
    createdAt: clinic.createdAt.toISOString(),
  };
}
