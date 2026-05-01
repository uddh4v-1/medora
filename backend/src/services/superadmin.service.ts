import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { issueImpersonationToken, hashPassword } from "@/services/auth.service";
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
  const { page, limit, search, status } = query;
  const skip = (page - 1) * limit;

  const searchClause = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Clinics with no subscription row are implicitly "trial"; include them when filtering for trial
  const statusClause = status
    ? status === "trial"
      ? { OR: [{ subscription: { billingStatus: "trial" } }, { subscription: null }] }
      : { subscription: { billingStatus: status } }
    : {};

  const andClauses = [
    ...(search ? [searchClause] : []),
    ...(status ? [statusClause] : []),
  ];
  const where = andClauses.length > 0 ? { AND: andClauses } : {};

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
    // Also reset billingStatus so cancelled/unpaid trials come back to life
    update: { trialEndsAt, billingStatus: "trial", plan: "trial" },
    select: { trialEndsAt: true, billingStatus: true },
  });

  return {
    clinicId,
    trialEndsAt: result.trialEndsAt?.toISOString() ?? null,
    billingStatus: result.billingStatus,
  };
}

export async function setBillingStatus(clinicId: string, body: SetBillingStatusBody) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  // When activating without specifying a plan, default to starter
  const plan = body.plan ?? (body.status === "active" ? "starter" : undefined);

  const data = {
    billingStatus: body.status,
    ...(plan ? { plan } : {}),
    ...(body.status === "active"
      ? { currentPeriodStart: now, currentPeriodEnd: periodEnd }
      : {}),
  };

  await prisma.clinicSubscription.upsert({
    where: { clinicId },
    create: { clinicId, ...data },
    update: data,
  });

  // Create an audit payment record for manual SuperAdmin activations
  if (body.status === "active") {
    await prisma.paymentRecord.create({
      data: {
        clinicId,
        amount: 0,
        plan: plan ?? "starter",
        status: "admin_activated",
        description: "Manually activated by SuperAdmin",
        periodStart: now,
        periodEnd,
      },
    });
  }

  return { clinicId, billingStatus: body.status, plan: plan ?? null };
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

export async function exportClinicsCsv(): Promise<string> {
  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, phone: true, status: true,
      city: true, state: true, createdAt: true,
      _count: { select: { users: true, patients: true, appointments: true } },
      subscription: { select: { plan: true, billingStatus: true, trialEndsAt: true } },
    },
  });
  const headers = ["ID", "Name", "Slug", "Phone", "Status", "City", "State", "Plan", "Billing Status", "Trial Ends", "Users", "Patients", "Appointments", "Created At"];
  const rows = clinics.map((c) => [
    c.id, c.name, c.slug, c.phone, c.status, c.city ?? "", c.state ?? "",
    c.subscription?.plan ?? "trial", c.subscription?.billingStatus ?? "trial",
    c.subscription?.trialEndsAt?.toISOString() ?? "",
    c._count.users, c._count.patients, c._count.appointments,
    c.createdAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

export async function exportUsersCsv(): Promise<string> {
  const users = await prisma.user.findMany({
    where: { role: { not: "SuperAdmin" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, role: true, status: true,
      emailVerified: true, createdAt: true,
      clinic: { select: { name: true, slug: true } },
    },
  });
  const headers = ["ID", "Name", "Email", "Role", "Status", "Email Verified", "Clinic", "Clinic Slug", "Created At"];
  const rows = users.map((u) => [
    u.id, u.name, u.email, u.role, u.status, u.emailVerified,
    u.clinic?.name ?? "", u.clinic?.slug ?? "", u.createdAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

export async function exportAuditLogsCsv(): Promise<string> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10000,
    select: {
      id: true, action: true, resource: true, ip: true,
      createdAt: true, clinicId: true,
      user: { select: { name: true, email: true } },
    },
  });
  const headers = ["ID", "Action", "Resource", "User Name", "User Email", "Clinic ID", "IP", "Timestamp"];
  const rows = logs.map((l) => [
    l.id, l.action, l.resource,
    l.user?.name ?? "", l.user?.email ?? "",
    l.clinicId ?? "", l.ip ?? "", l.createdAt.toISOString(),
  ]);
  return toCsv(headers, rows);
}

// ── Bulk Operations ───────────────────────────────────────────────────────────

export async function bulkClinicAction(body: { ids: string[]; action: "activate" | "suspend" | "delete" }) {
  if (body.action === "delete") {
    await prisma.clinic.deleteMany({ where: { id: { in: body.ids } } });
    return { affected: body.ids.length };
  }
  const status = body.action === "activate" ? "active" : ("suspended" as const);
  await prisma.clinic.updateMany({ where: { id: { in: body.ids } }, data: { status } });
  return { affected: body.ids.length };
}

export async function bulkPlanChange(body: { ids: string[]; plan: string; billingStatus: string }) {
  await prisma.clinicSubscription.updateMany({
    where: { clinicId: { in: body.ids } },
    data: { plan: body.plan, billingStatus: body.billingStatus },
  });
  return { affected: body.ids.length };
}

// ── Financial Dashboard ───────────────────────────────────────────────────────

const PLAN_PRICES: Record<string, number> = {
  trial: 0,
  starter: 2999,
  pro: 7999,
};

export async function getFinancialDashboard() {
  const now = new Date();

  const subs = await prisma.clinicSubscription.findMany({
    select: {
      clinicId: true,
      plan: true,
      billingStatus: true,
      trialEndsAt: true,
      currentPeriodStart: true,
      updatedAt: true,
    },
  });

  const activeSubs = subs.filter((s) => s.billingStatus === "active");
  const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);
  const arr = mrr * 12;

  const planGroups: Record<string, { count: number; mrr: number }> = {};
  for (const s of activeSubs) {
    if (!planGroups[s.plan]) planGroups[s.plan] = { count: 0, mrr: 0 };
    planGroups[s.plan].count++;
    planGroups[s.plan].mrr += PLAN_PRICES[s.plan] ?? 0;
  }
  const revenueByPlan = Object.entries(planGroups).map(([plan, data]) => ({
    plan,
    count: data.count,
    mrr: data.mrr,
  }));

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCancelled = subs.filter(
    (s) => s.billingStatus === "cancelled" && s.updatedAt >= thirtyDaysAgo,
  ).length;
  const churnBase = activeSubs.length + recentCancelled;
  const churnRate = churnBase > 0 ? (recentCancelled / churnBase) * 100 : 0;

  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const mrrTrend = months.map((month) => {
    const [y, m] = month.split("-").map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 1);

    const newMrr = subs
      .filter(
        (s) =>
          s.billingStatus === "active" &&
          s.currentPeriodStart &&
          s.currentPeriodStart >= monthStart &&
          s.currentPeriodStart < monthEnd,
      )
      .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

    const churnedMrr = subs
      .filter(
        (s) =>
          s.billingStatus === "cancelled" &&
          s.updatedAt >= monthStart &&
          s.updatedAt < monthEnd,
      )
      .reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0);

    return { month, newMrr, churnedMrr, netMrr: newMrr - churnedMrr };
  });

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const trialsExpiringSoon = subs.filter(
    (s) =>
      s.billingStatus === "trial" &&
      s.trialEndsAt &&
      s.trialEndsAt >= now &&
      s.trialEndsAt <= thirtyDaysFromNow,
  ).length;

  const totalNonTrial = subs.filter((s) => s.billingStatus !== "trial").length;
  const conversionRate =
    totalNonTrial > 0 ? (activeSubs.length / totalNonTrial) * 100 : 0;
  const avgActivePlanPrice =
    activeSubs.length > 0
      ? activeSubs.reduce((sum, s) => sum + (PLAN_PRICES[s.plan] ?? 0), 0) /
        activeSubs.length
      : PLAN_PRICES["starter"];
  const projectedNewMrr = Math.round(
    trialsExpiringSoon * (conversionRate / 100) * avgActivePlanPrice,
  );

  return {
    mrr,
    arr,
    revenueByPlan,
    churnRate: Math.round(churnRate * 10) / 10,
    mrrTrend,
    forecast: {
      trialsExpiringSoon,
      conversionRate: Math.round(conversionRate * 10) / 10,
      projectedNewMrr,
    },
    summary: {
      activeCount: activeSubs.length,
      trialCount: subs.filter((s) => s.billingStatus === "trial").length,
      cancelledCount: subs.filter((s) => s.billingStatus === "cancelled").length,
      unpaidCount: subs.filter((s) => s.billingStatus === "unpaid").length,
    },
  };
}

// ── Clinic Health Scores ──────────────────────────────────────────────────────

export async function getClinicHealthScores(query: {
  page: number;
  limit: number;
  search?: string;
  risk?: string;
}) {
  const { page, limit, search, risk } = query;
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { slug: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const clinics = await prisma.clinic.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      subscription: {
        select: { plan: true, billingStatus: true, trialEndsAt: true },
      },
    },
  });

  const clinicIds = clinics.map((c) => c.id);

  const [apptCounts, patientCounts, invoiceCounts, lastActivities] =
    await Promise.all([
      prisma.appointment.groupBy({
        by: ["clinicId"],
        where: { clinicId: { in: clinicIds }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
      prisma.patient.groupBy({
        by: ["clinicId"],
        where: { clinicId: { in: clinicIds }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
      prisma.invoice.groupBy({
        by: ["clinicId"],
        where: { clinicId: { in: clinicIds }, createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
      prisma.appointment.groupBy({
        by: ["clinicId"],
        where: { clinicId: { in: clinicIds } },
        _max: { createdAt: true },
      }),
    ]);

  const apptMap = new Map(apptCounts.map((a) => [a.clinicId, a._count.id]));
  const patientMap = new Map(patientCounts.map((p) => [p.clinicId, p._count.id]));
  const invoiceMap = new Map(invoiceCounts.map((i) => [i.clinicId, i._count.id]));
  const lastActivityMap = new Map(
    lastActivities.map((a) => [a.clinicId, a._max.createdAt]),
  );

  const allItems = clinics.map((clinic) => {
    const appointments = apptMap.get(clinic.id) ?? 0;
    const patients = patientMap.get(clinic.id) ?? 0;
    const invoices = invoiceMap.get(clinic.id) ?? 0;
    const lastActivityAt = lastActivityMap.get(clinic.id) ?? null;

    const score = Math.round(
      Math.min(appointments / 20, 1) * 40 +
        Math.min(patients / 10, 1) * 30 +
        Math.min(invoices / 10, 1) * 30,
    );

    const riskFactors: string[] = [];
    if (appointments === 0) riskFactors.push("No appointments in 30 days");
    if (patients === 0) riskFactors.push("No new patients recently");
    if (invoices === 0) riskFactors.push("No invoices raised recently");
    if (clinic.status === "suspended") riskFactors.push("Clinic suspended");

    const trialEndsAt = clinic.subscription?.trialEndsAt ?? null;
    if (trialEndsAt) {
      const daysLeft = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysLeft < 0) riskFactors.push("Trial expired");
      else if (daysLeft <= 7)
        riskFactors.push(`Trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`);
    }

    const riskLevel: "low" | "medium" | "high" =
      score >= 60 ? "low" : score >= 30 ? "medium" : "high";

    return {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      status: clinic.status,
      plan: clinic.subscription?.plan ?? "trial",
      billingStatus: clinic.subscription?.billingStatus ?? "trial",
      trialEndsAt: trialEndsAt?.toISOString() ?? null,
      score,
      riskLevel,
      riskFactors,
      activity: {
        appointmentsLast30: appointments,
        patientsLast30: patients,
        invoicesLast30: invoices,
        lastActivityAt: lastActivityAt?.toISOString() ?? null,
      },
    };
  });

  const atRiskCount = allItems.filter((i) => i.riskLevel === "high").length;
  const avgScore =
    allItems.length > 0
      ? Math.round(allItems.reduce((s, i) => s + i.score, 0) / allItems.length)
      : 0;

  const filtered =
    risk && risk !== "all" ? allItems.filter((i) => i.riskLevel === risk) : allItems;

  const skip = (page - 1) * limit;
  const paginatedItems = filtered.slice(skip, skip + limit);

  return {
    total: filtered.length,
    totalAll: clinics.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
    atRiskCount,
    avgScore,
    items: paginatedItems,
  };
}

// ── Onboarding Tracker ────────────────────────────────────────────────────────

export async function getOnboardingStatus(query: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = query;
  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const clinics = await prisma.clinic.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, status: true, createdAt: true,
      address: true, city: true, state: true, specialties: true, description: true,
      subscription: { select: { plan: true, billingStatus: true } },
      _count: { select: { users: true, patients: true, appointments: true } },
    },
  });

  const items = clinics.map((c) => {
    const steps = [
      { key: "profile", label: "Profile complete", done: Boolean(c.address && c.city && c.specialties.length > 0) },
      { key: "team", label: "Team member added", done: c._count.users > 1 },
      { key: "patient", label: "First patient added", done: c._count.patients > 0 },
      { key: "appointment", label: "First appointment booked", done: c._count.appointments > 0 },
      { key: "billing", label: "Billing configured", done: Boolean(c.subscription && c.subscription.billingStatus !== "trial") },
    ];
    const completed = steps.filter((s) => s.done).length;
    const percent = Math.round((completed / steps.length) * 100);
    return { id: c.id, name: c.name, slug: c.slug, status: c.status, createdAt: c.createdAt.toISOString(), percent, steps, plan: c.subscription?.plan ?? "trial", billingStatus: c.subscription?.billingStatus ?? "trial" };
  });

  const total = items.length;
  const skip = (page - 1) * limit;
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    needsNudge: items.filter((i) => i.percent < 60).length,
    items: items.slice(skip, skip + limit),
  };
}

// ── Broadcast Messaging ───────────────────────────────────────────────────────

export async function listSuperAdminBroadcasts(query: { page: number; limit: number }) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    prisma.superAdminBroadcast.count(),
    prisma.superAdminBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: items.map((b) => ({ ...b, createdAt: b.createdAt.toISOString(), sentAt: b.sentAt?.toISOString() ?? null, scheduledAt: b.scheduledAt?.toISOString() ?? null })),
  };
}

export async function sendSuperAdminBroadcast(body: {
  subject: string;
  body: string;
  segment: string;
  sentBy?: string;
}) {
  const owners = await prisma.user.findMany({
    where: { role: "Owner", status: "active", emailVerified: true },
    select: { email: true, name: true, clinic: { select: { subscription: { select: { billingStatus: true, plan: true } } } } },
  });

  const filtered = owners.filter((o) => {
    if (body.segment === "all") return true;
    const bs = o.clinic?.subscription?.billingStatus;
    const pl = o.clinic?.subscription?.plan;
    if (body.segment === "trial") return bs === "trial";
    if (body.segment === "active") return bs === "active";
    if (body.segment === "cancelled") return bs === "cancelled";
    if (body.segment === "starter") return pl === "starter";
    if (body.segment === "pro") return pl === "pro";
    return true;
  });

  const { sendBroadcastEmails } = await import("@/lib/send-broadcast-emails");
  const delivered = await sendBroadcastEmails({
    clinicName: "Medora Platform",
    title: body.subject,
    body: body.body,
    recipients: filtered.map((o) => ({ email: o.email, name: o.name })),
  });

  const record = await prisma.superAdminBroadcast.create({
    data: {
      subject: body.subject,
      body: body.body,
      segment: body.segment,
      recipientCount: delivered,
      sentBy: body.sentBy ?? null,
      sentAt: new Date(),
    },
  });

  return { id: record.id, delivered, recipientCount: filtered.length };
}

// ── Support Tickets ───────────────────────────────────────────────────────────

export async function listSupportTickets(query: { page: number; limit: number; search?: string; status?: string; priority?: string }) {
  const { page, limit, search, status, priority } = query;
  const skip = (page - 1) * limit;
  const where = {
    ...(status && status !== "all" ? { status } : {}),
    ...(priority && priority !== "all" ? { priority } : {}),
    ...(search ? { OR: [{ subject: { contains: search, mode: "insensitive" as const } }, { clinic: { name: { contains: search, mode: "insensitive" as const } } }] } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true, subject: true, status: true, priority: true, createdAt: true, updatedAt: true,
        clinic: { select: { id: true, name: true, slug: true } },
        _count: { select: { messages: true } },
      },
    }),
  ]);
  return {
    total, page, limit, totalPages: Math.ceil(total / limit),
    items: items.map((t) => ({ ...t, messageCount: t._count.messages, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
  };
}

export async function getTicketDetail(ticketId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { clinic: { select: { id: true, name: true, slug: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");
  return ticket;
}

export async function createTicket(body: { clinicId: string; subject: string; priority: string; message: string }) {
  const clinic = await prisma.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  const ticket = await prisma.supportTicket.create({
    data: {
      clinicId: body.clinicId,
      subject: body.subject,
      priority: body.priority,
      messages: { create: { body: body.message, isStaff: true } },
    },
    include: { messages: true },
  });
  return ticket;
}

export async function replyToTicket(ticketId: string, body: { message: string; isStaff: boolean; authorId?: string }) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");
  const msg = await prisma.ticketMessage.create({
    data: { ticketId, body: body.message, isStaff: body.isStaff, authorId: body.authorId ?? null },
  });
  await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: body.isStaff ? "in_progress" : "open", updatedAt: new Date() } });
  return msg;
}

export async function setTicketStatus(ticketId: string, status: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new HttpError(404, "Ticket not found", "NOT_FOUND");
  return prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
}

// ── SuperAdmin Account Management ─────────────────────────────────────────────

export async function listSuperAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: "SuperAdmin" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, status: true, emailVerified: true, createdAt: true },
  });
  return admins.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));
}

export async function createSuperAdmin(body: { name: string; email: string; password: string }) {
  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new HttpError(409, "Email already in use", "EMAIL_TAKEN");
  const passwordHash = await hashPassword(body.password);
  const admin = await prisma.user.create({
    data: { name: body.name, email: body.email, passwordHash, role: "SuperAdmin", emailVerified: true },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });
  return { ...admin, createdAt: admin.createdAt.toISOString() };
}

export async function deleteSuperAdmin(adminId: string, requesterId: string) {
  if (adminId === requesterId) throw new HttpError(400, "Cannot delete your own account", "SELF_DELETE");
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin || admin.role !== "SuperAdmin") throw new HttpError(404, "SuperAdmin not found", "NOT_FOUND");
  await prisma.user.delete({ where: { id: adminId } });
  return { ok: true };
}

// ── Payment History ───────────────────────────────────────────────────────────

export async function listPaymentRecords(query: { page: number; limit: number; clinicId?: string; search?: string }) {
  const { page, limit, clinicId, search } = query;
  const skip = (page - 1) * limit;
  const where = {
    ...(clinicId ? { clinicId } : {}),
    ...(search ? { clinic: { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] } } : {}),
  };
  const [total, items] = await Promise.all([
    prisma.paymentRecord.count({ where }),
    prisma.paymentRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { id: true, amount: true, plan: true, status: true, description: true, periodStart: true, periodEnd: true, createdAt: true, clinic: { select: { id: true, name: true, slug: true } } },
    }),
  ]);
  return {
    total, page, limit, totalPages: Math.ceil(total / limit),
    items: items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), periodStart: r.periodStart?.toISOString() ?? null, periodEnd: r.periodEnd?.toISOString() ?? null })),
  };
}

export async function createPaymentRecord(body: { clinicId: string; amount: number; plan: string; status: string; description?: string }) {
  const clinic = await prisma.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  const record = await prisma.paymentRecord.create({
    data: { clinicId: body.clinicId, amount: body.amount, plan: body.plan, status: body.status, description: body.description ?? null },
  });
  return record;
}

// ── GDPR / Data Tools ─────────────────────────────────────────────────────────

export async function listDeletionRequests(query: { page: number; limit: number; status?: string }) {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;
  const where = status && status !== "all" ? { status } : {};
  const [total, items] = await Promise.all([
    prisma.dataDeletionRequest.count({ where }),
    prisma.dataDeletionRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { id: true, reason: true, status: true, requestedBy: true, scheduledAt: true, completedAt: true, createdAt: true, updatedAt: true, clinic: { select: { id: true, name: true, slug: true } } },
    }),
  ]);
  return {
    total, page, limit, totalPages: Math.ceil(total / limit),
    items: items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(), scheduledAt: r.scheduledAt?.toISOString() ?? null, completedAt: r.completedAt?.toISOString() ?? null })),
  };
}

export async function createDeletionRequest(body: { clinicId: string; reason?: string; requestedBy?: string }) {
  const clinic = await prisma.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  const existing = await prisma.dataDeletionRequest.findFirst({ where: { clinicId: body.clinicId, status: { in: ["pending", "approved"] } } });
  if (existing) throw new HttpError(409, "Active deletion request already exists for this clinic", "DUPLICATE");
  return prisma.dataDeletionRequest.create({
    data: { clinicId: body.clinicId, reason: body.reason ?? null, requestedBy: body.requestedBy ?? null },
  });
}

export async function setDeletionRequestStatus(requestId: string, status: string) {
  const req = await prisma.dataDeletionRequest.findUnique({ where: { id: requestId } });
  if (!req) throw new HttpError(404, "Request not found", "NOT_FOUND");
  const data: Record<string, unknown> = { status };
  if (status === "approved") data["scheduledAt"] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  if (status === "completed") data["completedAt"] = new Date();
  return prisma.dataDeletionRequest.update({ where: { id: requestId }, data });
}

export async function exportClinicData(clinicId: string): Promise<string> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
      patients: { select: { id: true, name: true, phone: true, email: true, age: true, gender: true, createdAt: true } },
      appointments: { select: { id: true, date: true, status: true, reason: true, createdAt: true } },
      invoices: { select: { id: true, number: true, total: true, status: true, issuedAt: true } },
      subscription: true,
    },
  });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  return JSON.stringify(clinic, null, 2);
}

// ── System Health Monitor ─────────────────────────────────────────────────────

export async function getSystemHealth() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    clinicCount, userCount, patientCount, appointmentCount, invoiceCount,
    auditLast24h, auditLast7d, errorLogs, activeUsers24h,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.user.count({ where: { role: { not: "SuperAdmin" } } }),
    prisma.patient.count(),
    prisma.appointment.count(),
    prisma.invoice.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.auditLog.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.auditLog.count({ where: { action: { in: ["ERROR", "FAILED", "UNAUTHORIZED"] }, createdAt: { gte: oneDayAgo } } }),
    prisma.auditLog.groupBy({ by: ["userId"], where: { createdAt: { gte: oneDayAgo }, userId: { not: null } }, _count: { userId: true } }),
  ]);

  const auditByDay = await prisma.auditLog.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
  });
  const dayMap = new Map<string, number>();
  for (const l of auditByDay) {
    const d = l.createdAt.toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) ?? 0) + 1);
  }
  const activityTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: dayMap.get(key) ?? 0 };
  });

  return {
    db: { clinicCount, userCount, patientCount, appointmentCount, invoiceCount },
    activity: { last24h: auditLast24h, last7d: auditLast7d, errors24h: errorLogs, activeUsers24h: activeUsers24h.length },
    activityTrend,
    uptime: Math.floor(process.uptime()),
  };
}

// ── API Usage ─────────────────────────────────────────────────────────────────

export async function getApiUsage(query: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = query;
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const where = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }] }
    : {};

  const clinics = await prisma.clinic.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, status: true },
  });

  const clinicIds = clinics.map((c) => c.id);
  const usage = await prisma.auditLog.groupBy({
    by: ["clinicId"],
    where: { clinicId: { in: clinicIds }, createdAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  const usageMap = new Map(usage.map((u) => [u.clinicId, u._count.id]));

  const items = clinics
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug, status: c.status, requestsLast30d: usageMap.get(c.id) ?? 0 }))
    .sort((a, b) => b.requestsLast30d - a.requestsLast30d);

  const skip = (page - 1) * limit;
  return {
    total: items.length, page, limit,
    totalPages: Math.ceil(items.length / limit),
    items: items.slice(skip, skip + limit),
  };
}

// ── Custom Plan Builder ───────────────────────────────────────────────────────

function serializePlan(p: { createdAt: Date; updatedAt: Date; [k: string]: unknown }) {
  return { ...p, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() };
}

export async function listCustomPlans() {
  const plans = await prisma.customPlan.findMany({ orderBy: { sortOrder: "asc" } });
  return plans.map(serializePlan);
}

export async function getPublicPlans() {
  const plans = await prisma.customPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return plans.map(serializePlan);
}

type PlanBody = {
  name: string;
  description?: string;
  price: number;
  annualPrice?: number;
  planId?: string;
  maxPatients?: number;
  maxUsers?: number;
  features: Record<string, boolean>;
  displayFeatures?: string[];
  highlighted?: boolean;
  ctaText?: string;
  sortOrder?: number;
};

export async function createCustomPlan(body: PlanBody) {
  const plan = await prisma.customPlan.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      annualPrice: body.annualPrice ?? null,
      planId: body.planId ?? null,
      maxPatients: body.maxPatients ?? null,
      maxUsers: body.maxUsers ?? null,
      features: body.features,
      displayFeatures: body.displayFeatures ?? [],
      highlighted: body.highlighted ?? false,
      ctaText: body.ctaText ?? null,
      sortOrder: body.sortOrder ?? 0,
    },
  });
  return serializePlan(plan);
}

export async function updateCustomPlan(planId: string, body: Partial<PlanBody & { isActive: boolean }>) {
  const plan = await prisma.customPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new HttpError(404, "Plan not found", "NOT_FOUND");
  const updated = await prisma.customPlan.update({ where: { id: planId }, data: body });
  return serializePlan(updated);
}

export async function deleteCustomPlan(planId: string) {
  const plan = await prisma.customPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new HttpError(404, "Plan not found", "NOT_FOUND");
  await prisma.customPlan.delete({ where: { id: planId } });
  return { ok: true };
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
