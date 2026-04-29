import "dotenv/config";

import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/services/auth.service";
import { normalizeIndianMobile } from "../src/utils/phone";

const prisma = new PrismaClient();

/**
 * Matches what `POST /api/auth/register` creates — clinic + Owner user —
 * so login + JWT + `/api/auth/me` return a clinic.
 */
const DEMO = {
  email: "demo@medora.local",
  password: "demoMedora123!",
  clinicName: "Medora Demo Clinic",
  slug: "medora-demo",
  /** Digits shown to users as +91; stored E.164 on `Clinic.phone` */
  phone: "9876543210",
  ownerName: "Demo Owner",
} as const;

async function main() {
  const phoneE164 = normalizeIndianMobile(DEMO.phone);
  if (!phoneE164) {
    throw new Error(`Seed: invalid DEMO.phone ${DEMO.phone}`);
  }

  const [existingUser, existingSlug] = await Promise.all([
    prisma.user.findUnique({ where: { email: DEMO.email } }),
    prisma.clinic.findUnique({ where: { slug: DEMO.slug } }),
  ]);

  if (existingUser || existingSlug) {
    console.log(
      "Seed: demo clinic already exists. Use:",
      DEMO.email,
      "/",
      DEMO.password,
    );
    return;
  }

  const passwordHash = await hashPassword(DEMO.password);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const clinic = await tx.clinic.create({
      data: {
        name: DEMO.clinicName,
        slug: DEMO.slug,
        phone: phoneE164,
      },
    });

    await tx.user.create({
      data: {
        email: DEMO.email.toLowerCase(),
        passwordHash,
        name: DEMO.ownerName,
        role: "Owner",
        clinicId: clinic.id,
      },
    });
  });

  console.log("========================================");
  console.log("Seeded DEMO clinic + owner (usable for /login):");
  console.log("");
  console.log(`  Email:    ${DEMO.email}`);
  console.log(`  Password: ${DEMO.password}`);
  console.log(`  Clinic:   ${DEMO.clinicName}  (/book/${DEMO.slug})`);
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
