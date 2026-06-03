import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { issueImpersonationToken } from "@/services/auth.service";
import { logEvent } from "@/services/audit.service";

const REQUEST_TTL_MINUTES = 10;

type RequestStatus = "pending" | "approved" | "denied" | "expired";

type ImpersonationRequestDTO = {
  id: string;
  clinicId: string;
  clinicName: string;
  status: RequestStatus;
  reason: string | null;
  expiresAt: string;
  respondedAt: string | null;
  consumedAt: string | null;
  createdAt: string;
  superAdmin: { id: string; name: string; email: string };
  respondedBy: { id: string; name: string; email: string } | null;
};

function toDTO(
  r: {
    id: string;
    clinicId: string;
    status: string;
    reason: string | null;
    expiresAt: Date;
    respondedAt: Date | null;
    consumedAt: Date | null;
    createdAt: Date;
    clinic: { name: string };
    superAdmin: { id: string; name: string; email: string };
    respondedBy: { id: string; name: string; email: string } | null;
  },
): ImpersonationRequestDTO {
  return {
    id: r.id,
    clinicId: r.clinicId,
    clinicName: r.clinic.name,
    status: r.status as RequestStatus,
    reason: r.reason,
    expiresAt: r.expiresAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
    consumedAt: r.consumedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    superAdmin: r.superAdmin,
    respondedBy: r.respondedBy,
  };
}

const INCLUDE = {
  clinic: { select: { name: true } },
  superAdmin: { select: { id: true, name: true, email: true } },
  respondedBy: { select: { id: true, name: true, email: true } },
} as const;

/** SuperAdmin: open a new pending request for a clinic. Auto-expires existing pending. */
export async function createImpersonationRequest(args: {
  superAdminId: string;
  clinicId: string;
  reason?: string;
  ip: string | null;
}): Promise<ImpersonationRequestDTO> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: args.clinicId },
    select: { id: true, name: true, status: true },
  });
  if (!clinic) throw new HttpError(404, "Clinic not found", "NOT_FOUND");
  if (clinic.status === "suspended") {
    throw new HttpError(
      403,
      "Cannot impersonate a suspended clinic",
      "CLINIC_SUSPENDED",
    );
  }

  // Expire any prior pending request from this SuperAdmin for this clinic so
  // there's only ever one live request at a time per (admin, clinic).
  await prisma.impersonationRequest.updateMany({
    where: {
      superAdminId: args.superAdminId,
      clinicId: args.clinicId,
      status: "pending",
    },
    data: { status: "expired" },
  });

  const expiresAt = new Date(Date.now() + REQUEST_TTL_MINUTES * 60_000);
  const created = await prisma.impersonationRequest.create({
    data: {
      clinicId: args.clinicId,
      superAdminId: args.superAdminId,
      reason: args.reason ?? null,
      status: "pending",
      expiresAt,
    },
    include: INCLUDE,
  });

  logEvent({
    userId: args.superAdminId,
    clinicId: args.clinicId,
    action: "IMPERSONATION_REQUESTED",
    resource: `clinic:${args.clinicId}`,
    metadata: { requestId: created.id, reason: args.reason ?? null },
    ip: args.ip,
  });

  return toDTO(created);
}

/** SuperAdmin: list own requests (recent + pending). */
export async function listMyImpersonationRequests(
  superAdminId: string,
): Promise<ImpersonationRequestDTO[]> {
  const rows = await prisma.impersonationRequest.findMany({
    where: { superAdminId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: INCLUDE,
  });
  return autoExpire(rows).map(toDTO);
}

/** Clinic side: list pending requests addressed to the signed-in user's clinic. */
export async function listPendingRequestsForClinic(
  clinicId: string,
): Promise<ImpersonationRequestDTO[]> {
  const rows = await prisma.impersonationRequest.findMany({
    where: { clinicId, status: "pending" },
    orderBy: { createdAt: "desc" },
    include: INCLUDE,
  });
  return autoExpire(rows).map(toDTO);
}

/** Clinic side (Owner/Doctor): approve a pending request. */
export async function approveImpersonationRequest(args: {
  requestId: string;
  responderId: string;
  responderClinicId: string;
  ip: string | null;
}): Promise<ImpersonationRequestDTO> {
  const r = await loadFresh(args.requestId);
  ensureSameClinic(r.clinicId, args.responderClinicId);
  ensurePendingAndNotExpired(r);

  const updated = await prisma.impersonationRequest.update({
    where: { id: args.requestId },
    data: {
      status: "approved",
      respondedAt: new Date(),
      respondedById: args.responderId,
    },
    include: INCLUDE,
  });

  logEvent({
    userId: args.responderId,
    clinicId: args.responderClinicId,
    action: "IMPERSONATION_APPROVED",
    resource: `impersonation_request:${args.requestId}`,
    metadata: { superAdminId: updated.superAdminId },
    ip: args.ip,
  });

  return toDTO(updated);
}

/** Clinic side (Owner/Doctor): deny a pending request. */
export async function denyImpersonationRequest(args: {
  requestId: string;
  responderId: string;
  responderClinicId: string;
  ip: string | null;
}): Promise<ImpersonationRequestDTO> {
  const r = await loadFresh(args.requestId);
  ensureSameClinic(r.clinicId, args.responderClinicId);
  ensurePendingAndNotExpired(r);

  const updated = await prisma.impersonationRequest.update({
    where: { id: args.requestId },
    data: {
      status: "denied",
      respondedAt: new Date(),
      respondedById: args.responderId,
    },
    include: INCLUDE,
  });

  logEvent({
    userId: args.responderId,
    clinicId: args.responderClinicId,
    action: "IMPERSONATION_DENIED",
    resource: `impersonation_request:${args.requestId}`,
    metadata: { superAdminId: updated.superAdminId },
    ip: args.ip,
  });

  return toDTO(updated);
}

/** SuperAdmin: consume an approved request → returns the impersonation JWT. */
export async function consumeImpersonationRequest(args: {
  requestId: string;
  superAdminId: string;
  ip: string | null;
}): Promise<{
  token: string;
  clinicId: string;
  clinicName: string;
  ownerName: string;
  ownerEmail: string;
}> {
  const r = await loadFresh(args.requestId);
  if (r.superAdminId !== args.superAdminId) {
    throw new HttpError(403, "Not your request", "FORBIDDEN");
  }
  if (r.status !== "approved") {
    throw new HttpError(409, "Request is not approved", "INVALID_STATE");
  }
  if (r.consumedAt) {
    throw new HttpError(409, "Request already consumed", "INVALID_STATE");
  }
  if (r.expiresAt.getTime() < Date.now()) {
    await prisma.impersonationRequest.update({
      where: { id: r.id },
      data: { status: "expired" },
    });
    throw new HttpError(410, "Request expired", "EXPIRED");
  }

  const owner = await prisma.user.findFirst({
    where: { clinicId: r.clinicId, role: "Owner" },
    select: { id: true, email: true, name: true },
  });
  if (!owner) {
    throw new HttpError(404, "No Owner found for this clinic", "NOT_FOUND");
  }

  const token = issueImpersonationToken({
    ownerId: owner.id,
    ownerEmail: owner.email,
    clinicId: r.clinicId,
    superAdminId: args.superAdminId,
  });

  await prisma.impersonationRequest.update({
    where: { id: r.id },
    data: { consumedAt: new Date() },
  });

  logEvent({
    userId: args.superAdminId,
    clinicId: r.clinicId,
    action: "IMPERSONATE",
    resource: `clinic:${r.clinicId}`,
    metadata: {
      targetUserId: owner.id,
      targetEmail: owner.email,
      requestId: r.id,
    },
    ip: args.ip,
  });

  return {
    token,
    clinicId: r.clinicId,
    clinicName: r.clinic.name,
    ownerName: owner.name,
    ownerEmail: owner.email,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function loadFresh(id: string) {
  const r = await prisma.impersonationRequest.findUnique({
    where: { id },
    include: INCLUDE,
  });
  if (!r) throw new HttpError(404, "Request not found", "NOT_FOUND");
  return r;
}

function ensureSameClinic(reqClinicId: string, userClinicId: string) {
  if (reqClinicId !== userClinicId) {
    throw new HttpError(403, "Not your clinic's request", "FORBIDDEN");
  }
}

function ensurePendingAndNotExpired(r: {
  status: string;
  expiresAt: Date;
  id: string;
}) {
  if (r.status !== "pending") {
    throw new HttpError(409, "Request is not pending", "INVALID_STATE");
  }
  if (r.expiresAt.getTime() < Date.now()) {
    throw new HttpError(410, "Request expired", "EXPIRED");
  }
}

function autoExpire<T extends { status: string; expiresAt: Date; id: string }>(
  rows: T[],
): T[] {
  const now = Date.now();
  const expiredIds = rows
    .filter((r) => r.status === "pending" && r.expiresAt.getTime() < now)
    .map((r) => r.id);
  if (expiredIds.length > 0) {
    // Fire-and-forget — the next list will reflect it.
    prisma.impersonationRequest
      .updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "expired" },
      })
      .catch(() => undefined);
  }
  return rows.map((r) =>
    expiredIds.includes(r.id)
      ? ({ ...r, status: "expired" } as T)
      : r,
  );
}
