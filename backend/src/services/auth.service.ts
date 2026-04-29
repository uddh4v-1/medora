import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { Prisma } from "@prisma/client";

import { getEnv } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { normalizeIndianMobile } from "@/utils/phone";
import { HttpError } from "@/utils/http-error";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "Owner" | "Doctor" | "Receptionist";
  clinic: { id: string; name: string; slug: string } | null;
};

export type JwtAccessPayload = jwt.JwtPayload & {
  sub: string;
  email: string;
  role: AuthUser["role"];
  clinicId?: string;
};

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
    if (role !== "Owner" && role !== "Doctor" && role !== "Receptionist") {
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
  clinic: { id: string; name: string; slug: string } | null;
}): AuthUser {
  const role = row.role as AuthUser["role"];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role,
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
      passwordHash: true,
      clinic: {
        select: { id: true, name: true, slug: true },
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

  const env = getEnv();
  const expiresIn = rememberMe
    ? env.JWT_REMEMBER_ME_EXPIRES_IN
    : env.JWT_SESSION_EXPIRES_IN;

  const authUser = rowToAuthUser({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
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
      const clinic = await tx.clinic.create({
        data: {
          name: input.clinicName.trim(),
          slug,
          phone: phoneE164,
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

/** Load user from DB (preferred for `/me` to reflect role/email updates). */
export async function findUserById(id: string): Promise<AuthUser | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clinic: {
        select: { id: true, name: true, slug: true },
      },
    },
  });
  if (!row) return null;
  return rowToAuthUser(row);
}
