import { prisma } from "@/lib/prisma";
import type {
  InvoicesQuery,
  PatientsQuery,
  QueueQuery,
  ReportsQuery,
  RevenueSummaryQuery,
} from "@/schemas/dashboard.schemas";
import { HttpError } from "@/utils/http-error";

type ApiQueueStatus = "waiting" | "in-progress" | "completed";
type DbVisitStatus = "waiting" | "in_progress" | "completed";
type DbAppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

function toApiVisitStatus(status: DbVisitStatus): ApiQueueStatus {
  if (status === "in_progress") return "in-progress";
  return status;
}

function toDbVisitStatus(status: ApiQueueStatus): DbVisitStatus {
  if (status === "in-progress") return "in_progress";
  return status;
}

function pageMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function asDateStart(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

function asDateEnd(iso: string): Date {
  return new Date(`${iso}T23:59:59.999Z`);
}

function yyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchDashboardOverview(clinicId: string, doctorId?: string) {
  const now = new Date();
  const today = yyyyMmDd(now);
  const start = asDateStart(today);
  const end = asDateEnd(today);
  const docFilter = doctorId ? { doctorId } : {};

  const [appointmentsToday, waitingCount, inProgressVisit, patientsTotal, unpaidCount] =
    await Promise.all([
      prisma.appointment.count({
        where: { clinicId, date: { gte: start, lte: end }, ...docFilter },
      }),
      prisma.visit.count({
        where: { clinicId, status: "waiting", ...docFilter },
      }),
      prisma.visit.findFirst({
        where: { clinicId, status: "in_progress", ...docFilter },
        orderBy: { startedAt: "asc" },
        include: {
          patient: { select: { id: true, name: true } },
          doctor: { select: { id: true, name: true } },
        },
      }),
      prisma.patient.count({
        where: { clinicId },
      }),
      prisma.invoice.count({
        where: { clinicId, status: "unpaid" },
      }),
    ]);

  const todayScheduleRows = await prisma.appointment.findMany({
    where: { clinicId, date: { gte: start, lte: end }, ...docFilter },
    orderBy: [{ startTime: "asc" }],
    take: 8,
    include: {
      patient: { select: { id: true, name: true } },
      doctor: { select: { id: true, name: true } },
    },
  });

  return {
    stats: {
      appointmentsToday,
      waitingCount,
      patientsTotal,
      unpaidCount,
    },
    nowServing: inProgressVisit
      ? {
          id: inProgressVisit.id,
          patientId: inProgressVisit.patientId,
          patientName: inProgressVisit.patient.name,
          doctorId: inProgressVisit.doctorId,
          doctorName: inProgressVisit.doctor?.name ?? null,
          title: inProgressVisit.title,
          reason: inProgressVisit.reason,
          status: toApiVisitStatus(inProgressVisit.status),
          startedAt: inProgressVisit.startedAt.toISOString(),
        }
      : null,
    todaySchedule: todayScheduleRows.map(
      (a: {
        id: string;
        date: Date;
        startTime: string;
        endTime: string;
        reason: string;
        status: DbAppointmentStatus;
        patientId: string;
        patient: { name: string };
        doctorId: string | null;
        doctor: { name: string } | null;
      }) => ({
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
      patientId: a.patientId,
      patientName: a.patient.name,
      doctorId: a.doctorId,
      doctorName: a.doctor?.name ?? null,
    })),
  };
}

export async function fetchPatients(clinicId: string, query: PatientsQuery) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;
  const q = search?.trim();

  const where = {
    clinicId,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        phone: true,
        age: true,
        gender: true,
        nextVisitDate: true,
        createdAt: true,
      },
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    items: rows.map(
      (p: {
        id: string;
        name: string;
        phone: string;
        age: number | null;
        gender: string | null;
        nextVisitDate: Date | null;
        createdAt: Date;
      }) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      nextVisitDate: p.nextVisitDate ? yyyyMmDd(p.nextVisitDate) : null,
      createdAt: p.createdAt.toISOString(),
    })),
    ...pageMeta(total, page, limit),
  };
}

export async function fetchQueue(clinicId: string, query: QueueQuery, doctorId?: string) {
  const statusFilter = query.status ? toDbVisitStatus(query.status) : undefined;
  const docFilter = doctorId ? { doctorId } : {};

  const [rows, waiting, inProgress, completed] = await Promise.all([
    prisma.visit.findMany({
      where: {
        clinicId,
        ...docFilter,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: [{ startedAt: "asc" }],
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    }),
    prisma.visit.count({ where: { clinicId, status: "waiting", ...docFilter } }),
    prisma.visit.count({ where: { clinicId, status: "in_progress", ...docFilter } }),
    prisma.visit.count({ where: { clinicId, status: "completed", ...docFilter } }),
  ]);

  return {
    items: rows.map((v: {
      id: string;
      patientId: string;
      patient: { name: string };
      doctorId: string | null;
      doctor: { name: string } | null;
      title: string;
      reason: string;
      status: DbVisitStatus;
      startedAt: Date;
    }) => ({
      id: v.id,
      patientId: v.patientId,
      patientName: v.patient.name,
      doctorId: v.doctorId,
      doctorName: v.doctor?.name ?? null,
      title: v.title,
      reason: v.reason,
      status: toApiVisitStatus(v.status),
      startedAt: v.startedAt.toISOString(),
    })),
    counts: {
      waiting,
      inProgress,
      completed,
    },
  };
}

export async function updateQueueStatus(
  clinicId: string,
  visitId: string,
  status: ApiQueueStatus,
): Promise<void> {
  const existing = await prisma.visit.findFirst({
    where: { id: visitId, clinicId },
    select: { id: true },
  });

  if (!existing) {
    throw new HttpError(404, "Visit not found", "NOT_FOUND");
  }

  await prisma.visit.update({
    where: { id: visitId },
    data: { status: toDbVisitStatus(status) },
  });
}

export async function fetchInvoices(clinicId: string, query: InvoicesQuery) {
  const { page, limit, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    clinicId,
    ...(status ? { status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    items: rows.map((inv: {
      id: string;
      number: string;
      total: number;
      status: "paid" | "unpaid";
      discount: number | null;
      gst: number | null;
      issuedAt: Date;
      patientId: string;
      patient: { name: string };
      doctorId: string | null;
      doctor: { name: string } | null;
    }) => ({
      id: inv.id,
      number: inv.number,
      total: inv.total,
      status: inv.status,
      discount: inv.discount,
      gst: inv.gst,
      issuedAt: inv.issuedAt.toISOString(),
      patientId: inv.patientId,
      patientName: inv.patient.name,
      doctorId: inv.doctorId,
      doctorName: inv.doctor?.name ?? null,
    })),
    ...pageMeta(total, page, limit),
  };
}

export async function fetchRevenueSummary(clinicId: string, query: RevenueSummaryQuery) {
  const from = asDateStart(query.from);
  const to = asDateEnd(query.to);

  if (from > to) {
    throw new HttpError(400, "`from` must be <= `to`", "VALIDATION_ERROR");
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      clinicId,
      issuedAt: { gte: from, lte: to },
    },
    select: {
      id: true,
      number: true,
      total: true,
      status: true,
      issuedAt: true,
      patient: { select: { name: true } },
    },
    orderBy: { issuedAt: "asc" },
  });

  const paid = invoices.filter(
    (i: { status: "paid" | "unpaid" }) => i.status === "paid",
  );
  const unpaid = invoices.filter(
    (i: { status: "paid" | "unpaid" }) => i.status === "unpaid",
  );

  const collected = paid.reduce((sum: number, i: { total: number }) => sum + i.total, 0);
  const outstanding = unpaid.reduce((sum: number, i: { total: number }) => sum + i.total, 0);

  const grouped = new Map<string, number>();
  for (const inv of paid) {
    const k = yyyyMmDd(inv.issuedAt);
    grouped.set(k, (grouped.get(k) ?? 0) + inv.total);
  }

  const series = Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const todayKey = yyyyMmDd(new Date());
  const today = grouped.get(todayKey) ?? 0;

  return {
    range: { from: query.from, to: query.to },
    series,
    totals: {
      today,
      thisPeriod: collected,
      previousPeriod: 0,
      collected,
      outstanding,
    },
    outstandingInvoices: unpaid.map((u: {
      id: string;
      number: string;
      patient: { name: string };
      total: number;
    }) => ({
      id: u.id,
      number: u.number,
      patientName: u.patient.name,
      total: u.total,
    })),
  };
}

export async function fetchReportsOverview(clinicId: string, query: ReportsQuery) {
  const from = asDateStart(query.from);
  const to = asDateEnd(query.to);

  if (from > to) throw new HttpError(400, "`from` must be <= `to`", "VALIDATION_ERROR");

  const [prescriptionItems, appointments] = await Promise.all([
    prisma.prescriptionItem.findMany({
      where: { prescription: { clinicId, date: { gte: from, lte: to } } },
      select: { name: true },
    }),
    prisma.appointment.findMany({
      where: { clinicId, date: { gte: from, lte: to } },
      select: {
        status: true,
        date: true,
        doctor: { select: { name: true } },
      },
    }),
  ]);

  // Top medications
  const medMap = new Map<string, number>();
  for (const item of prescriptionItems) {
    if (item.name) medMap.set(item.name, (medMap.get(item.name) ?? 0) + 1);
  }
  const topMedications = [...medMap.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // No-show rate
  const noShowCount = appointments.filter((a) => a.status === "no_show").length;
  const total = appointments.length;
  const ratePercent = total > 0 ? Math.round((noShowCount / total) * 100) : null;

  // Doctor utilization
  const docMap = new Map<string, number>();
  for (const a of appointments) {
    const name = a.doctor?.name ?? "Unassigned";
    docMap.set(name, (docMap.get(name) ?? 0) + 1);
  }
  const doctorUtilization = [...docMap.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([name, appointmentCount]) => ({ name, appointmentCount }));

  // Daily appointments trend
  const trendMap = new Map<string, number>();
  for (const a of appointments) {
    const d = yyyyMmDd(a.date);
    trendMap.set(d, (trendMap.get(d) ?? 0) + 1);
  }
  const appointmentsTrend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    range: { from: query.from, to: query.to },
    topMedications,
    noShow: { count: noShowCount, total, ratePercent },
    doctorUtilization,
    appointmentsTrend,
  };
}