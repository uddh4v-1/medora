/**
 * Creates a SuperAdmin user directly in the database.
 * Usage:
 *   EMAIL=admin@medora.dev NAME="Super Admin" PASSWORD=secret123 \
 *   npx tsx src/scripts/create-superadmin.ts
 */
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.EMAIL;
  const name = process.env.NAME ?? "Super Admin";
  const password = process.env.PASSWORD;

  if (!email || !password) {
    console.error("ERROR: Set EMAIL and PASSWORD environment variables.");
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "SuperAdmin", passwordHash, name, clinicId: null },
    create: {
      email,
      name,
      passwordHash,
      role: "SuperAdmin",
      emailVerified: true,
      clinicId: null,
    },
  });

  console.log(`SuperAdmin created: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
