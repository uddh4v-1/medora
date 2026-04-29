import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuditLogsQuery } from "@/schemas/audit.schemas";

export type LogEventInput = {
  userId?: string | null;
  clinicId?: string | null;
  action: string;
  resource: string;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
};

export function logEvent(input: LogEventInput): void {
  prisma.auditLog
    .create({
      data: {
        userId: input.userId ?? null,
        clinicId: input.clinicId ?? null,
        action: input.action,
        resource: input.resource,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
    .catch(() => {
      // fire-and-forget; do not propagate audit failures to callers
    });
}

export async function getAuditLogs(query: AuditLogsQuery) {
  const { page, limit, userId, clinicId, action, from, to } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(userId ? { userId } : {}),
    ...(clinicId ? { clinicId } : {}),
    ...(action ? { action } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        userId: true,
        clinicId: true,
        action: true,
        resource: true,
        metadata: true,
        ip: true,
        userAgent: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    items: logs.map((l) => ({
      id: l.id,
      userId: l.userId,
      userName: l.user?.name ?? null,
      userEmail: l.user?.email ?? null,
      clinicId: l.clinicId,
      action: l.action,
      resource: l.resource,
      metadata: l.metadata,
      ip: l.ip,
      userAgent: l.userAgent,
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

export async function getSuperAdminStats() {
  const [totalClinics, totalUsers, totalEvents, recentEvents] = await Promise.all([
    prisma.clinic.count(),
    prisma.user.count({ where: { role: { not: "SuperAdmin" } } }),
    prisma.auditLog.count(),
    prisma.auditLog.count({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  return { totalClinics, totalUsers, totalEvents, recentEvents };
}
