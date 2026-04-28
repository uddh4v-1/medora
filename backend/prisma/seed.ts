import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/services/auth.service";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@clinic.in";
  const password = "adminadmin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed skipped: user already exists", email);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: "Owner",
    },
  });

  console.log("Seeded demo user:", email, `(password: ${password})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
