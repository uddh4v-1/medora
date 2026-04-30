import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";

const LIMITS: Record<string, { maxPatients: number; maxDoctors: number }> = {
  trial:      { maxPatients: 500,      maxDoctors: 1        },
  solo:       { maxPatients: 500,      maxDoctors: 1        },
  clinic:     { maxPatients: Infinity, maxDoctors: 5        },
  enterprise: { maxPatients: Infinity, maxDoctors: Infinity },
};

function limitsFor(plan: string | null | undefined) {
  return LIMITS[plan ?? "trial"] ?? LIMITS.trial;
}

export async function assertPatientLimit(clinicId: string) {
  const [sub, count] = await Promise.all([
    prisma.clinicSubscription.findUnique({ where: { clinicId }, select: { plan: true } }),
    prisma.patient.count({ where: { clinicId } }),
  ]);
  const { maxPatients } = limitsFor(sub?.plan);
  if (count >= maxPatients) {
    throw new HttpError(
      403,
      `Patient limit reached for your plan (max ${maxPatients}). Upgrade to add more patients.`,
      "PLAN_LIMIT",
    );
  }
}

export async function assertDoctorLimit(clinicId: string) {
  const [sub, count] = await Promise.all([
    prisma.clinicSubscription.findUnique({ where: { clinicId }, select: { plan: true } }),
    prisma.user.count({ where: { clinicId, role: "Doctor" } }),
  ]);
  const { maxDoctors } = limitsFor(sub?.plan);
  if (count >= maxDoctors) {
    throw new HttpError(
      403,
      `Doctor limit reached for your plan (max ${maxDoctors}). Upgrade to add more doctors.`,
      "PLAN_LIMIT",
    );
  }
}
