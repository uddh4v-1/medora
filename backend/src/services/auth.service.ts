import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import ms from "ms";
import type { Prisma } from "@prisma/client";

import { getEnv } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { normalizeIndianMobile } from "@/utils/phone";
import { HttpError } from "@/utils/http-error";
import { getPlatformConfig } from "@/services/superadmin.service";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "Owner" | "Doctor" | "Receptionist" | "SuperAdmin";
  emailVerified: boolean;
  clinic: { id: string; name: string; slug: string } | null;
  isImpersonating?: boolean;
  impersonatedBy?: string;
};

export type JwtAccessPayload = jwt.JwtPayload & {
  sub: string;
  email: string;
  role: AuthUser["role"];
  clinicId?: string;
  isImpersonation?: boolean;
  impersonatedBy?: string;
};

export const IMPERSONATION_COOKIE_NAME = "medora_impersonation";

/** Hash a password for storage (e.g. seed or register later). */
export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}

/** Issue HS256 JWT (same payload used in httpOnly cookie). */
export function issueAccessToken(
  user: {
    id: string;
    email: string;
    role: AuthUser["role"];
    clinicId?: string | null;
  },
  options?: { expiresIn?: string },
): string {
  const env = getEnv();
  const expiresIn = options?.expiresIn ?? env.JWT_EXPIRES_IN;
  const payload: jwt.JwtPayload & {
    sub: string;
    email: string;
    role: AuthUser["role"];
    clinicId?: string;
  } = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  if (user.clinicId) payload.clinicId = user.clinicId;

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
    issuer: "medora-api",
  } as jwt.SignOptions);
}

/** Issue a short-lived impersonation JWT for a clinic owner session. */
export function issueImpersonationToken(params: {
  ownerId: string;
  ownerEmail: string;
  clinicId: string;
  superAdminId: string;
}): string {
  const env = getEnv();
  const payload: JwtAccessPayload = {
    sub: params.ownerId,
    email: params.ownerEmail,
    role: "Owner",
    clinicId: params.clinicId,
    isImpersonation: true,
    impersonatedBy: params.superAdminId,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "1h",
    issuer: "medora-api",
  } as jwt.SignOptions);
}

/** Verify JWT from cookie or bearer string. */
export function verifyAccessToken(token: string): JwtAccessPayload {
  const env = getEnv();
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: "medora-api",
    });
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.sub !== "string" ||
      typeof decoded.email !== "string"
    ) {
      throw new HttpError(401, "Invalid session", "INVALID_TOKEN");
    }
    const role = (decoded as { role?: unknown }).role;
    if (
      role !== "Owner" &&
      role !== "Doctor" &&
      role !== "Receptionist" &&
      role !== "SuperAdmin"
    ) {
      throw new HttpError(401, "Invalid session", "INVALID_TOKEN");
    }
    const clinicId = (decoded as { clinicId?: unknown }).clinicId;
    if (clinicId !== undefined && clinicId !== null && typeof clinicId !== "string") {
      throw new HttpError(401, "Invalid session", "INVALID_TOKEN");
    }
    return decoded as JwtAccessPayload;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(401, "Invalid or expired session", "INVALID_TOKEN");
  }
}

/** Parse `Authorization: Bearer …` when present */
export function bearerToken(req: {
  headers: { authorization?: string };
}): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  const raw = h.slice(7).trim();
  return raw.length ? raw : null;
}

function rowToAuthUser(row: {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  clinic: { id: string; name: string; slug: string } | null;
}): AuthUser {
  const role = row.role as AuthUser["role"];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role,
    emailVerified: row.emailVerified,
    clinic: row.clinic,
  };
}

export async function loginWithCredentials(
  email: string,
  password: string,
  rememberMe = false,
): Promise<{ token: string; user: AuthUser; signedInAt: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      emailVerified: true,
      passwordHash: true,
      clinic: {
        select: { id: true, name: true, slug: true, status: true },
      },
    },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordOk = await argon2.verify(user.passwordHash, password);
  if (!passwordOk) {
    throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.role !== "SuperAdmin") {
    const { maintenanceMode } = await getPlatformConfig();
    if (maintenanceMode) {
      throw new HttpError(503, "The platform is currently under maintenance. Please try again later.", "MAINTENANCE_MODE");
    }
  }

  if (user.status === "suspended") {
    throw new HttpError(403, "Your account has been suspended. Contact support.", "USER_SUSPENDED");
  }

  if (user.clinic?.status === "suspended") {
    throw new HttpError(403, "This clinic has been suspended. Contact support.", "CLINIC_SUSPENDED");
  }

  const env = getEnv();
  const expiresIn = rememberMe
    ? env.JWT_REMEMBER_ME_EXPIRES_IN
    : env.JWT_SESSION_EXPIRES_IN;

  const authUser = rowToAuthUser({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
    clinic: user.clinic,
  });

  const token = issueAccessToken(
    {
      id: user.id,
      email: user.email,
      role: authUser.role,
      clinicId: user.clinic?.id ?? null,
    },
    { expiresIn },
  );

  return {
    token,
    user: authUser,
    signedInAt: new Date().toISOString(),
  };
}

/**
 * Signup from clinic registration UI — creates clinic + owner user, signs in via cookie.
 */
export async function registerClinicOwner(input: {
  clinicName: string;
  phone: string;
  ownerName: string;
  email: string;
  password: string;
  slug: string;
}): Promise<{ token: string; user: AuthUser; signedInAt: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const slug = input.slug.trim().toLowerCase();

  const phoneE164 = normalizeIndianMobile(input.phone);
  if (!phoneE164) {
    throw new HttpError(400, "Enter a valid Indian mobile number", "INVALID_PHONE");
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingEmail) {
    throw new HttpError(409, "Email already registered", "EMAIL_IN_USE");
  }

  const existingSlug = await prisma.clinic.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (existingSlug) {
    throw new HttpError(409, "This clinic URL is already taken", "SLUG_IN_USE");
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const { userRow } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const clinic = await tx.clinic.create({
        data: {
          name: input.clinicName.trim(),
          slug,
          phone: phoneE164,
          featureFlags: { create: {} },
          subscription: {
            create: { plan: "trial", billingStatus: "trial", trialEndsAt },
          },
        },
      });

      const userRow = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: input.ownerName.trim(),
          role: "Owner",
          clinicId: clinic.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          clinic: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      return { userRow };
    });

    const authUser = rowToAuthUser(userRow);

    const token = issueAccessToken({
      id: userRow.id,
      email: userRow.email,
      role: authUser.role,
      clinicId: userRow.clinic?.id ?? null,
    });

    return {
      token,
      user: authUser,
      signedInAt: new Date().toISOString(),
    };
  } catch (e: unknown) {
    if (
      e !== null &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: unknown }).code === "P2002"
    ) {
      const meta = (e as { meta?: { target?: unknown } }).meta?.target;
      const target = Array.isArray(meta) ? meta.join(",") : String(meta ?? "");
      if (target.includes("slug")) {
        throw new HttpError(409, "This clinic URL is already taken", "SLUG_IN_USE");
      }
      throw new HttpError(409, "Email already registered", "EMAIL_IN_USE");
    }
    throw e;
  }
}

export async function createRefreshToken(
  userId: string,
  rememberMe: boolean,
): Promise<string> {
  const env = getEnv();
  const ttl = rememberMe ? env.JWT_REMEMBER_ME_EXPIRES_IN : env.JWT_SESSION_EXPIRES_IN;
  const expiresAt = new Date(
    Date.now() + (ms(ttl as Parameters<typeof ms>[0]) as number),
  );

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.refreshToken.create({
    data: { tokenHash, userId, rememberMe, expiresAt },
  });

  return rawToken;
}

export async function rotateRefreshToken(rawToken: string): Promise<{
  accessToken: string;
  rawRefreshToken: string;
  rememberMe: boolean;
  user: AuthUser;
}> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, rememberMe: true, expiresAt: true },
  });

  if (!record) throw new HttpError(401, "Invalid or expired session", "INVALID_TOKEN");
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: record.id } });
    throw new HttpError(401, "Session expired. Please sign in again.", "TOKEN_EXPIRED");
  }

  const user = await findUserById(record.userId);
  if (!user) throw new HttpError(401, "User not found", "USER_NOT_FOUND");

  // Delete the used token and issue a fresh one (rotation)
  await prisma.refreshToken.delete({ where: { id: record.id } });
  const newRawRefresh = await createRefreshToken(record.userId, record.rememberMe);

  const env = getEnv();
  const accessToken = issueAccessToken(
    { id: record.userId, email: user.email, role: user.role, clinicId: user.clinic?.id },
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );

  return { accessToken, rawRefreshToken: newRawRefresh, rememberMe: record.rememberMe, user };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw new HttpError(404, "User not found", "USER_NOT_FOUND");

  const passwordOk = await argon2.verify(user.passwordHash, currentPassword);
  if (!passwordOk) throw new HttpError(401, "Current password is incorrect", "INVALID_CREDENTIALS");

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
}

/** Load user from DB (preferred for `/me` to reflect role/email updates). */
export async function findUserById(id: string): Promise<AuthUser | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      clinic: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
  if (!row) return null;
  return rowToAuthUser(row);
}
