import { apiGet, apiPost } from "./api";
import type {
  AuthResponse,
  ForgotPasswordBody,
  ForgotPasswordResponse,
  GetMeResponse,
  LoginBody,
  RefreshResponse,
  RegisterBody,
  ResetPasswordBody,
  ResetPasswordResponse,
} from "./types/auth.types";

/** Path prefix relative to `apiClient.baseURL`. */
export const AUTH_BASE = "/api/auth";

export async function postLogin(body: LoginBody) {
  return apiPost<AuthResponse>(`${AUTH_BASE}/login`, {
    email: body.email.trim(),
    password: body.password,
    rememberMe: body.rememberMe ?? false,
  });
}

export async function postRegister(body: RegisterBody) {
  return apiPost<AuthResponse>(`${AUTH_BASE}/register`, {
    clinicName: body.clinicName.trim(),
    phone: body.phone.trim(),
    ownerName: body.ownerName.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
    slug: body.slug,
    acceptTerms: body.acceptTerms,
  });
}

/** `GET /api/auth/me` — validates JWT cookie, returns current user from DB. */
export async function getMe() {
  return apiGet<GetMeResponse>(`${AUTH_BASE}/me`);
}

/** Alias — same as {@link getMe}. */
export async function fetchSession() {
  return getMe();
}

export async function postLogout() {
  const r = await apiPost<unknown>(`${AUTH_BASE}/logout`);
  return { ok: r.ok, status: r.status };
}

/**
 * Silently rotates the refresh cookie and issues a new access cookie.
 * Called automatically by the Axios interceptor — call manually only if needed.
 */
export async function postRefreshToken() {
  return apiPost<RefreshResponse>(`${AUTH_BASE}/refresh`);
}

/** Forgot password — always treat 200 generic success (never enumerate emails). */
export async function postForgotPassword(body: ForgotPasswordBody) {
  return apiPost<ForgotPasswordResponse>(
    `${AUTH_BASE}/forgot-password`,
    body,
  );
}

export async function postResetPassword(body: ResetPasswordBody) {
  return apiPost<ResetPasswordResponse>(`${AUTH_BASE}/reset-password`, body);
}

export type {
  ApiErrorFields,
  AuthResponse,
  AuthSessionPayload,
  AuthUser,
  ClinicSummary,
  ForgotPasswordBody,
  ForgotPasswordResponse,
  GetMeResponse,
  LoginBody,
  RefreshResponse,
  RegisterBody,
  ResetPasswordBody,
  ResetPasswordResponse,
  UserRole,
} from "./types/auth.types";
