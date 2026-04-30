import { prisma } from "@/lib/prisma";

export type DiscoverQuery = {
  name?:      string;
  city?:      string;
  pincode?:   string;
  specialty?: string;
  lat?:       number;
  lng?:       number;
  radiusKm?:  number;
};

export async function getClinicBySlug(slug: string) {
  const clinic = await prisma.clinic.findFirst({
    where: {
      slug, status: "active",
      OR: [{ featureFlags: null }, { featureFlags: { publicBooking: true } }],
    },
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
    where: {
      slug, status: "active",
      OR: [{ featureFlags: null }, { featureFlags: { publicBooking: true } }],
    },
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

type ProximityRow = {
  id: string; name: string; slug: string; phone: string;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; specialties: string[]; description: string | null;
  doctor_count: bigint; distance_km: number;
};

export async function discoverClinics(query: DiscoverQuery) {
  const { name, city, pincode, specialty, lat, lng, radiusKm = 10 } = query;

  // Proximity search when lat/lng are provided
  if (lat !== undefined && lng !== undefined) {
    const rows = await prisma.$queryRaw<ProximityRow[]>`
      SELECT sub.*
      FROM (
        SELECT
          c.id, c.name, c.slug, c.phone,
          c.address, c.city, c.state, c.pincode,
          c.specialties, c.description,
          (SELECT COUNT(*) FROM users u
           WHERE u.clinic_id = c.id AND u.role = 'Doctor' AND u.status = 'active') AS doctor_count,
          (6371 * acos(LEAST(1.0,
            cos(radians(${lat})) * cos(radians(c.latitude)) *
            cos(radians(c.longitude) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians(c.latitude))
          ))) AS distance_km
        FROM clinics c
        LEFT JOIN clinic_feature_flags f ON f.clinic_id = c.id
        WHERE c.status = 'active'
          AND (f.public_booking IS NULL OR f.public_booking = true)
          AND c.latitude IS NOT NULL
          AND c.longitude IS NOT NULL
          AND (${specialty ?? null}::text IS NULL OR ${specialty ?? null}::text = ANY(c.specialties))
      ) sub
      WHERE sub.distance_km <= ${radiusKm}
      ORDER BY sub.distance_km ASC
      LIMIT 30
    `;

    return rows.map((c) => ({
      id: c.id, name: c.name, slug: c.slug, phone: c.phone,
      address: c.address, city: c.city, state: c.state, pincode: c.pincode,
      specialties: c.specialties, description: c.description,
      doctorCount: Number(c.doctor_count),
      distanceKm: Math.round(c.distance_km * 10) / 10,
    }));
  }

  // Text search: clinic name or city/pincode
  // Treat missing featureFlags row as publicBooking=true (the default)
  const clinics = await prisma.clinic.findMany({
    where: {
      status: "active",
      OR: [
        { featureFlags: null },
        { featureFlags: { publicBooking: true } },
      ],
      ...(name    && { name:    { contains: name,    mode: "insensitive" } }),
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
    id: c.id, name: c.name, slug: c.slug, phone: c.phone,
    address: c.address, city: c.city, state: c.state, pincode: c.pincode,
    specialties: c.specialties, description: c.description,
    doctorCount: c._count.users,
    distanceKm: undefined as number | undefined,
  }));
}
