import { prisma } from "@/lib/prisma";

export type DiscoverQuery = {
  city?:      string;
  pincode?:   string;
  specialty?: string;
};

export async function getClinicBySlug(slug: string) {
  const clinic = await prisma.clinic.findFirst({
    where: { slug, status: "active", featureFlags: { publicBooking: true } },
    select: {
      id: true, name: true, slug: true, phone: true,
      address: true, city: true, state: true, pincode: true,
      specialties: true, description: true,
      users: {
        where: { role: "Doctor", status: "active" },
        select: { id: true, name: true },
      },
    },
  });
  if (!clinic) return null;
  return {
    id:          clinic.id,
    name:        clinic.name,
    slug:        clinic.slug,
    phone:       clinic.phone,
    address:     clinic.address,
    city:        clinic.city,
    state:       clinic.state,
    pincode:     clinic.pincode,
    specialties: clinic.specialties,
    description: clinic.description,
    doctors:     clinic.users.map((u) => ({ id: u.id, name: u.name })),
  };
}

export type PublicBookingInput = {
  name:       string;
  phone:      string;
  reason?:    string;
  doctorId?:  string | null;
  date:       string;
  startTime:  string;
  endTime:    string;
};

export async function createPublicAppointment(
  slug: string,
  input: PublicBookingInput,
) {
  const clinic = await prisma.clinic.findFirst({
    where: { slug, status: "active", featureFlags: { publicBooking: true } },
    select: { id: true },
  });
  if (!clinic) return null;

  let patient = await prisma.patient.findFirst({
    where: { clinicId: clinic.id, phone: input.phone },
    select: { id: true },
  });
  if (!patient) {
    patient = await prisma.patient.create({
      data: { clinicId: clinic.id, name: input.name, phone: input.phone },
      select: { id: true },
    });
  }

  const appointment = await prisma.appointment.create({
    data: {
      clinicId:  clinic.id,
      patientId: patient.id,
      doctorId:  input.doctorId ?? null,
      date:      new Date(`${input.date}T00:00:00.000Z`),
      startTime: input.startTime,
      endTime:   input.endTime,
      reason:    input.reason?.trim() || "Online booking",
      status:    "scheduled",
    },
    select: {
      id: true, startTime: true, endTime: true, reason: true, status: true,
      patient: { select: { name: true } },
      doctor:  { select: { name: true } },
    },
  });

  return {
    id:          appointment.id,
    patientName: appointment.patient.name,
    doctorName:  appointment.doctor?.name ?? null,
    date:        input.date,
    startTime:   appointment.startTime,
    endTime:     appointment.endTime,
    reason:      appointment.reason,
    status:      appointment.status,
  };
}

export async function discoverClinics(query: DiscoverQuery) {
  const { city, pincode, specialty } = query;

  const clinics = await prisma.clinic.findMany({
    where: {
      status: "active",
      featureFlags: { publicBooking: true },
      ...(city    && { city:    { contains: city,    mode: "insensitive" } }),
      ...(pincode && { pincode: { contains: pincode, mode: "insensitive" } }),
      ...(specialty && { specialties: { has: specialty } }),
    },
    select: {
      id: true, name: true, slug: true, phone: true,
      address: true, city: true, state: true, pincode: true,
      specialties: true, description: true,
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return clinics.map((c) => ({
    id:           c.id,
    name:         c.name,
    slug:         c.slug,
    phone:        c.phone,
    address:      c.address,
    city:         c.city,
    state:        c.state,
    pincode:      c.pincode,
    specialties:  c.specialties,
    description:  c.description,
    doctorCount:  c._count.users,
  }));
}
