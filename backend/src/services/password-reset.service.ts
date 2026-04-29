import { createHash, randomBytes } from "node:crypto";

import { getEnv } from "@/config/env";
import { sendPasswordResetEmail } from "@/lib/password-reset-email";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/services/auth.service";
import { HttpError } from "@/utils/http-error";

/** SHA-256 hex of the raw secret — never store the raw token */
function hashPlainToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

async function invalidateUserResetTokens(userId: string): Promise<void> {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
}

/**
 * If the email exists, issues a reset token (hashed), emails a link, and clears prior tokens for that user.
 * If unknown email, resolves without error (timing not padded — harden separately if needed).
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[password-reset] No registered user for "${email}" — no email sent (UI still shows success).`,
      );
    }
    return;
  }

  const env = getEnv();
  await invalidateUserResetTokens(user.id);

  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashPlainToken(rawToken);
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const sep = env.APP_ORIGIN.endsWith("/") ? "" : "/";
  const resetUrl = `${env.APP_ORIGIN}${sep}reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendPasswordResetEmail({ to: email, resetUrl });
}

export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const trimmed = rawToken.trim();
  if (!trimmed) {
    throw new HttpError(400, "Reset link is invalid", "INVALID_TOKEN");
  }

  const tokenHash = hashPlainToken(trimmed);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
    },
  });

  if (!row || row.expiresAt < new Date()) {
    throw new HttpError(
      400,
      "Reset link is invalid or has expired — request a new one",
      "INVALID_OR_EXPIRED_TOKEN",
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);
}
