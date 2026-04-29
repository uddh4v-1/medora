import crypto from "crypto";

import { getEnv } from "@/config/env";
import { sendVerificationEmail } from "@/lib/verify-email";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function requestEmailVerification(userId: string): Promise<void> {
  const env = getEnv();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");
  if (user.emailVerified) throw new HttpError(409, "Email already verified", "ALREADY_VERIFIED");

  // Invalidate any existing tokens for this user
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  const ttlMinutes = env.EMAIL_VERIFICATION_TTL_MINUTES;
  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { tokenHash, userId, expiresAt },
  });

  const verifyUrl = `${env.APP_ORIGIN}/verify-email?token=${rawToken}`;
  await sendVerificationEmail({ to: user.email, verifyUrl });
}

export async function verifyEmailWithToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!record) throw new HttpError(400, "Invalid or expired verification link", "INVALID_TOKEN");
  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    throw new HttpError(400, "Verification link has expired. Request a new one.", "TOKEN_EXPIRED");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}
