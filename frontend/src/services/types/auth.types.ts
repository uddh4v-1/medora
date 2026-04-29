/**
 * Auth API request/response shapes — mirrors backend payloads where noted.
 */

/** Roles returned on `User`/`AuthUser`. */
export type UserRole = "Owner" | "Doctor" | "Receptionist" | "SuperAdmin";

/** Embedded clinic stub on authenticated user responses. */
export interface ClinicSummary {
  id: string;
  name: string;
  slug: string;
}

/** User row as returned by auth endpoints (`/login`, `/register`, `/me`). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  clinic: ClinicSummary | null;
}

/** Payload after successful login or register (`user` + signed-in timestamp). */
export interface AuthSessionPayload {
  user: AuthUser;
  signedInAt: string;
}

/** Optional error fields the API may include on non-2xx responses. */
export interface ApiErrorFields {
  error?: string;
  code?: string;
}

/** Response body for login/register (includes error fields on failure). */
export type AuthResponse = Partial<AuthSessionPayload> & ApiErrorFields;

/** Response body for `GET /api/auth/me`. */
export interface GetMeResponse extends ApiErrorFields {
  user?: AuthUser;
}

/** `POST /api/auth/login` JSON body. */
export interface LoginBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/** `POST /api/auth/register` JSON body. */
export interface RegisterBody {
  clinicName: string;
  phone: string;
  ownerName: string;
  email: string;
  password: string;
  slug: string;
  acceptTerms: boolean;
}

/** `POST /api/auth/forgot-password` */
export interface ForgotPasswordBody {
  email: string;
}

/** Success body — same message whether or not the email exists (no enumeration). */
export interface ForgotPasswordResponse extends ApiErrorFields {
  message?: string;
}

/** `POST /api/auth/reset-password` */
export interface ResetPasswordBody {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse extends ApiErrorFields {
  message?: string;
}

/** Response body for `POST /api/auth/refresh`. */
export interface RefreshResponse extends ApiErrorFields {
  user?: AuthUser;
}
