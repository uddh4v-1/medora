import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import { hashPassword } from "@/services/auth.service";
import type { CreateTeamMemberBody } from "@/schemas/team.schemas";

export async function fetchTeamMembers(clinicId: string) {
  const rows = await prisma.user.findMany({
    where: { clinicId },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    items: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as "Owner" | "Doctor" | "Receptionist",
      specialty: null as string | null,
      fee: null as number | null,
    })),
  };
}

export async function addTeamMember(clinicId: string, body: CreateTeamMemberBody) {
  const existing = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true },
  });
  if (existing) throw new HttpError(409, "Email already in use", "CONFLICT");

  const passwordHash = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role,
      clinicId,
      emailVerified: false,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "Owner" | "Doctor" | "Receptionist",
    specialty: body.specialty ?? null,
    fee: body.fee ?? null,
  };
}

export async function removeTeamMember(clinicId: string, userId: string, requesterId: string) {
  if (userId === requesterId) {
    throw new HttpError(400, "Cannot remove yourself", "BAD_REQUEST");
  }

  const member = await prisma.user.findFirst({
    where: { id: userId, clinicId },
    select: { id: true, role: true },
  });
  if (!member) throw new HttpError(404, "Team member not found", "NOT_FOUND");
  if (member.role === "Owner") {
    throw new HttpError(400, "Cannot remove an owner", "BAD_REQUEST");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { clinicId: null },
  });
}
