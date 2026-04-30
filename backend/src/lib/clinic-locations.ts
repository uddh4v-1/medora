import { prisma } from "@/lib/prisma";

/**
 * Given any clinicId (root or branch), return the root clinic ID.
 * Used to scope "what clinics can this user access?"
 */
export async function resolveRootClinicId(clinicId: string): Promise<string> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { parentClinicId: true },
  });
  return clinic?.parentClinicId ?? clinicId;
}

/**
 * Return all clinic IDs in the same group as the given clinicId
 * (root + all branches).
 */
export async function getGroupClinicIds(clinicId: string): Promise<string[]> {
  const rootId = await resolveRootClinicId(clinicId);
  const branches = await prisma.clinic.findMany({
    where: { parentClinicId: rootId },
    select: { id: true },
  });
  return [rootId, ...branches.map((b) => b.id)];
}

export async function getGroupClinics(clinicId: string) {
  const rootId = await resolveRootClinicId(clinicId);
  const [root, branches] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: rootId },
      select: {
        id: true, name: true, slug: true, phone: true,
        city: true, address: true, parentClinicId: true,
      },
    }),
    prisma.clinic.findMany({
      where: { parentClinicId: rootId },
      select: {
        id: true, name: true, slug: true, phone: true,
        city: true, address: true, parentClinicId: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  if (!root) return [];
  return [root, ...branches];
}
