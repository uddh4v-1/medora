import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import type { UpdateClinicBody } from "@/schemas/clinic.schemas";

const CLINIC_SELECT = {
  id: true, name: true, slug: true, phone: true,
  address: true, city: true, state: true, pincode: true,
  specialties: true, description: true, createdAt: true,
} as const;

function formatClinic(c: {
  id: string; name: string; slug: string; phone: string;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; specialties: string[]; description: string | null;
  createdAt: Date;
}) {
  return {
    id: c.id, name: c.name, slug: c.slug, phone: c.phone,
    address: c.address, city: c.city, state: c.state, pincode: c.pincode,
    specialties: c.specialties, description: c.description,
    createdAt: c.createdAt.toISOString(),
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
    },
    select: CLINIC_SELECT,
  });

  return formatClinic(clinic);
}
