import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { issueImpersonationToken } from "@/services/auth.service";
import { requestPasswordReset } from "@/services/password-reset.service";
import { logEvent } from "@/services/audit.service";
import type {
  ListClinicsQuery,
  ListUsersQuery,
  SetClinicStatusBody,
  SetUserStatusBody,
  ListConfigFlagsQuery,
  UpdateFlagsBody,
  UpdatePlatformConfigBody,
  ListBillingQuery,
  ExtendTrialBody,
  SetBillingStatusBody,
} from "@/schemas/superadmin.schemas";

export async function listClinics(query: ListClinicsQuery) {
  const { page, limit, search, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, clinics] = await Promise.all([
    prisma.clinic.count({ where }),
    prisma.clinic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        phone: true,
        status: true,
        createdAt: true,
        _count: {
          select: { users: true, patients: true },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: clinics.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      phone: c.phone,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      userCount: c._count.users,
      patientCount: c._count.patients,
    })),
  };
}

export async function getClinicDetail(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: { patients: true, visits: true, appointments: true, invoices: true },
      },
    },
  });

  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  return {
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    phone: clinic.phone,
    status: clinic.status,
    createdAt: clinic.createdAt.toISOString(),
    updatedAt: clinic.updatedAt.toISOString(),
    patientCount: clinic._count.patients,
    visitCount: clinic._count.visits,
    appointmentCount: clinic._count.appointments,
    invoiceCount: clinic._count.invoices,
    users: clinic.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
    })),
  };
}

export async function setClinicStatus(clinicId: string, body: SetClinicStatusBody) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: { status: body.status },
    select: { id: true, name: true, status: true },
  });

  return updated;
}

export async function deleteClinic(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  await prisma.clinic.delete({ where: { id: clinicId } });
  return { ok: true };
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(query: ListUsersQuery) {
  const { page, limit, search, role, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    role: { not: "SuperAdmin" as const },
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        clinic: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as "Owner" | "Doctor" | "Receptionist",
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      clinic: u.clinic ?? null,
    })),
  };
}

export async function setUserStatus(userId: string, body: SetUserStatusBody) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");
  if (user.role === "SuperAdmin") throw new HttpError(403, "Cannot suspend a SuperAdmin", "FORBIDDEN");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: body.status },
    select: { id: true, name: true, email: true, status: true },
  });
  return updated;
}

export async function forcePasswordReset(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");

  await requestPasswordReset(user.email);
  return { ok: true };
}

export async function verifyUserEmail(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found", "NOT_FOUND");

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
  return { ok: true };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function buildDateRange(startDate: Date, days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

export async function getAnalytics() {
  const now = new Date();

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [statusCounts, recentClinics, recentAppointments, patientCounts] =
    await Promise.all([
      prisma.clinic.groupBy({ by: ["status"], _count: { id: true } }),
      prisma.clinic.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.appointment.findMany({
        where: { date: { gte: fourteenDaysAgo } },
        select: { date: true },
      }),
      prisma.patient.groupBy({
        by: ["clinicId"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

  const regMap = new Map<string, number>();
  for (const c of recentClinics) {
    const day = c.createdAt.toISOString().slice(0, 10);
    regMap.set(day, (regMap.get(day) ?? 0) + 1);
  }

  const apptMap = new Map<string, number>();
  for (const a of recentAppointments) {
    const day = a.date.toISOString().slice(0, 10);
    apptMap.set(day, (apptMap.get(day) ?? 0) + 1);
  }

  const clinicIds = patientCounts.map((r) => r.clinicId);
  const clinicsForTop =
    clinicIds.length > 0
      ? await prisma.clinic.findMany({
          where: { id: { in: clinicIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const clinicMap = new Map(clinicsForTop.map((c) => [c.id, c]));

  const sm: Record<string, number> = {};
  for (const s of statusCounts) sm[s.status] = s._count.id;

  return {
    clinicStats: {
      total: (sm["active"] ?? 0) + (sm["suspended"] ?? 0),
      active: sm["active"] ?? 0,
      suspended: sm["suspended"] ?? 0,
    },
    clinicRegistrations: buildDateRange(thirtyDaysAgo, 30).map((date) => ({
      date,
      count: regMap.get(date) ?? 0,
    })),
    appointmentsByDay: buildDateRange(fourteenDaysAgo, 14).map((date) => ({
      date,
      count: apptMap.get(date) ?? 0,
    })),
    topClinicsByPatients: patientCounts.map((r) => ({
      id: r.clinicId,
      name: clinicMap.get(r.clinicId)?.name ?? "Unknown",
      slug: clinicMap.get(r.clinicId)?.slug ?? "",
      patientCount: r._count.id,
    })),
  };
}

// ── Feature Flags ─────────────────────────────────────────────────────────────

export async function listClinicFlags(query: ListConfigFlagsQuery) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, clinics] = await Promise.all([
    prisma.clinic.count({ where }),
    prisma.clinic.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        featureFlags: { select: { publicBooking: true, whatsappNotifications: true } },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: clinics.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      flags: {
        publicBooking: c.featureFlags?.publicBooking ?? true,
        whatsappNotifications: c.featureFlags?.whatsappNotifications ?? false,
      },
    })),
  };
}

export async function updateClinicFlags(clinicId: string, body: UpdateFlagsBody) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  const data = {
    ...(body.publicBooking !== undefined ? { publicBooking: body.publicBooking } : {}),
    ...(body.whatsappNotifications !== undefined
      ? { whatsappNotifications: body.whatsappNotifications }
      : {}),
  };

  const result = await prisma.clinicFeatureFlags.upsert({
    where: { clinicId },
    create: { clinicId, ...data },
    update: data,
    select: { publicBooking: true, whatsappNotifications: true },
  });

  return { clinicId, flags: result };
}

const PLATFORM_CONFIG_ID = "platform_config_singleton";

export async function getPlatformConfig() {
  const config = await prisma.platformConfig.findUnique({
    where: { id: PLATFORM_CONFIG_ID },
    select: { maintenanceMode: true, bannerMessage: true },
  });
  return {
    maintenanceMode: config?.maintenanceMode ?? false,
    bannerMessage: config?.bannerMessage ?? null,
  };
}

export async function updatePlatformConfig(body: UpdatePlatformConfigBody) {
  const data: { maintenanceMode?: boolean; bannerMessage?: string | null } = {};
  if (body.maintenanceMode !== undefined) data.maintenanceMode = body.maintenanceMode;
  if (body.bannerMessage !== undefined) data.bannerMessage = body.bannerMessage;

  const result = await prisma.platformConfig.upsert({
    where: { id: PLATFORM_CONFIG_ID },
    create: { id: PLATFORM_CONFIG_ID, ...data },
    update: data,
    select: { maintenanceMode: true, bannerMessage: true },
  });

  return result;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export async function listBilling(query: ListBillingQuery) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, clinics] = await Promise.all([
    prisma.clinic.count({ where }),
    prisma.clinic.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            billingStatus: true,
            trialEndsAt: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: clinics.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      plan: c.subscription?.plan ?? "trial",
      billingStatus: c.subscription?.billingStatus ?? "trial",
      trialEndsAt: c.subscription?.trialEndsAt?.toISOString() ?? null,
      currentPeriodStart: c.subscription?.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: c.subscription?.currentPeriodEnd?.toISOString() ?? null,
    })),
  };
}

export async function extendTrial(clinicId: string, body: ExtendTrialBody) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  const existing = await prisma.clinicSubscription.findUnique({ where: { clinicId } });
  const base =
    existing?.trialEndsAt && existing.trialEndsAt > new Date()
      ? existing.trialEndsAt
      : new Date();

  const trialEndsAt = new Date(base);
  trialEndsAt.setDate(trialEndsAt.getDate() + body.days);

  const result = await prisma.clinicSubscription.upsert({
    where: { clinicId },
    create: { clinicId, plan: "trial", billingStatus: "trial", trialEndsAt },
    update: { trialEndsAt },
    select: { trialEndsAt: true },
  });

  return { clinicId, trialEndsAt: result.trialEndsAt?.toISOString() ?? null };
}

export async function setBillingStatus(clinicId: string, body: SetBillingStatusBody) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const data = {
    billingStatus: body.status,
    ...(body.plan ? { plan: body.plan } : {}),
    ...(body.status === "active"
      ? { currentPeriodStart: now, currentPeriodEnd: periodEnd }
      : {}),
  };

  await prisma.clinicSubscription.upsert({
    where: { clinicId },
    create: { clinicId, ...data },
    update: data,
  });

  return { clinicId, billingStatus: body.status };
}

// ── Impersonation ─────────────────────────────────────────────────────────────

export async function impersonateClinic(
  clinicId: string,
  superAdminId: string,
  ip: string | null,
) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, status: true },
  });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  if (clinic.status === "suspended") {
    throw new HttpError(403, "Cannot impersonate a suspended clinic", "CLINIC_SUSPENDED");
  }

  const owner = await prisma.user.findFirst({
    where: { clinicId, role: "Owner" },
    select: { id: true, email: true, name: true, emailVerified: true },
  });
  if (!owner) throw new HttpError(404, "No Owner found for this clinic", "NOT_FOUND");

  const token = issueImpersonationToken({
    ownerId: owner.id,
    ownerEmail: owner.email,
    clinicId,
    superAdminId,
  });

  logEvent({
    userId: superAdminId,
    clinicId,
    action: "IMPERSONATE",
    resource: `clinic:${clinicId}`,
    metadata: { targetUserId: owner.id, targetEmail: owner.email },
    ip,
  });

  return {
    token,
    clinicName: clinic.name,
    ownerName: owner.name,
    ownerEmail: owner.email,
  };
}
