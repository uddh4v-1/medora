import { PrismaClient } from "@prisma/client";

type GlobalPrisma = { prisma?: PrismaClient };

const globalForPrisma = globalThis as unknown as GlobalPrisma;

const logLevels =
  process.env.NODE_ENV === "development"
    ? (["query", "error", "warn"] as const)
    : (["error"] as const);

function createPrismaClient(): PrismaClient {
  return new PrismaClient({ log: [...logLevels] });
}

/** After schema changes (`prisma generate`), the dev singleton can still hold an old client without newer delegates → `*.deleteMany` on undefined. */
function hasPasswordResetDelegate(client: unknown): boolean {
  return (
    typeof client === "object" &&
    client !== null &&
    "passwordResetToken" in client &&
    typeof (client as { passwordResetToken?: { deleteMany?: unknown } })
      .passwordResetToken?.deleteMany === "function"
  );
}

function getPrisma(): PrismaClient {
  let cached = globalForPrisma.prisma;

  if (cached && hasPasswordResetDelegate(cached)) {
    return cached;
  }

  if (cached && !hasPasswordResetDelegate(cached)) {
    void cached.$disconnect();
    globalForPrisma.prisma = undefined;
  }

  const next = createPrismaClient();
  if (
    process.env.NODE_ENV !== "production" &&
    !hasPasswordResetDelegate(next)
  ) {
    console.error(
      "[prisma] Generated client missing `passwordResetToken` — run `npx prisma generate` and migrate/push.",
    );
  }
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = next;
  }
  return next;
}

/** Single PrismaClient per process — refreshed in dev if the singleton predates newer models. */
export const prisma = getPrisma();
