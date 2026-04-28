import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { getEnv } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";

export type AuthUser = {
  id: string;
  email: string;
  role: "Owner" | "Doctor" | "Receptionist";
};

export type JwtAccessPayload = jwt.JwtPayload & {
  sub: string;
  email: string;
  role: AuthUser["role"];
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
export function issueAccessToken(user: {
  id: string;
  email: string;
  role: AuthUser["role"];
}): string {
  const env = getEnv();
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
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

export async function loginWithCredentials(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser; signedInAt: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordOk = await argon2.verify(user.passwordHash, password);
  if (!passwordOk) {
    throw new HttpError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const role = user.role as AuthUser["role"];

  const token = issueAccessToken({
    id: user.id,
    email: user.email,
    role,
  });

  return {
    token,
    user: { id: user.id, email: user.email, role },
    signedInAt: new Date().toISOString(),
  };
}

/** Self-service signup — role `Receptionist`; promote via admin flows later. */
export async function registerWithCredentials(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser; signedInAt: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    throw new HttpError(409, "Email already registered", "EMAIL_IN_USE");
  }

  const passwordHash = await hashPassword(password);

  let row;
  try {
    row = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "Receptionist",
      },
    });
  } catch (e: unknown) {
    if (
      e !== null &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: unknown }).code === "P2002"
    ) {
      throw new HttpError(409, "Email already registered", "EMAIL_IN_USE");
    }
    throw e;
  }

  const role = row.role as AuthUser["role"];

  const token = issueAccessToken({
    id: row.id,
    email: row.email,
    role,
  });

  return {
    token,
    user: { id: row.id, email: row.email, role },
    signedInAt: new Date().toISOString(),
  };
}

/** Load user from DB (preferred for `/me` to reflect role/email updates). */
export async function findUserById(id: string): Promise<AuthUser | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role as AuthUser["role"],
  };
}
