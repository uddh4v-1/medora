import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

import type { ApiOutcome } from "./types/api.types";
import type { AuthUser } from "./types/auth.types";

export type { ApiOutcome };

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:4100"
  );
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  // All HTTP statuses resolve (no throw) — callers check res.status / res.ok
  validateStatus: () => true,
});

function toOutcome<T>(res: AxiosResponse<T>): ApiOutcome<T> {
  const ok = res.status >= 200 && res.status < 300;
  return { ok, status: res.status, data: (res.data ?? {}) as T };
}

// ---------------------------------------------------------------------------
// Silent token-refresh interceptor
//
// Because validateStatus returns true, all responses land in the success
// handler — including 401s. When a 401 is seen on a non-auth endpoint the
// interceptor calls POST /api/auth/refresh (which rotates the httpOnly
// refresh cookie and issues a new access cookie), then retries the original
// request transparently. Concurrent 401s queue behind the single refresh.
// ---------------------------------------------------------------------------

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// Auth endpoints that must never trigger a refresh retry
const SKIP_REFRESH = [
  "/auth/login",
  "/auth/refresh",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
];

let isRefreshing = false;
let waitQueue: Array<(ok: boolean) => void> = [];

function drainQueue(ok: boolean) {
  waitQueue.splice(0).forEach((cb) => cb(ok));
}

apiClient.interceptors.response.use(async (response) => {
  const config = response.config as RetryConfig;

  if (
    response.status !== 401 ||
    config._retry ||
    SKIP_REFRESH.some((p) => config.url?.includes(p))
  ) {
    return response;
  }

  // Prevent this request from looping through the interceptor again
  config._retry = true;

  // If a refresh is already in flight, queue and wait for it
  if (isRefreshing) {
    const ok = await new Promise<boolean>((resolve) => waitQueue.push(resolve));
    return ok ? apiClient(config) : response;
  }

  isRefreshing = true;
  let refreshOk = false;

  try {
    const r = await apiClient.post<{ user: AuthUser }>("/api/auth/refresh");
    refreshOk = r.status === 200;

    if (refreshOk && r.data?.user && typeof window !== "undefined") {
      // Lazily import to avoid pulling a "use client" module into server bundles
      const { useClinicStore } = await import("@/stores/clinic-store");
      const u = r.data.user;
      useClinicStore.getState().signIn({
        userId: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        clinic: u.clinic,
        signedInAt: new Date().toISOString(),
      });
    }
  } finally {
    isRefreshing = false;
    drainQueue(refreshOk);
  }

  if (refreshOk) return apiClient(config);

  // Refresh failed — clear local state and hard-redirect to login
  if (typeof window !== "undefined") {
    const { useClinicStore } = await import("@/stores/clinic-store");
    useClinicStore.getState().signOut();
    window.location.replace("/login");
  }

  return response;
});

/** GET */
export async function apiGet<T>(path: string): Promise<ApiOutcome<T>> {
  return toOutcome(await apiClient.get<T>(path));
}

/** POST JSON body */
export async function apiPost<T, B = unknown>(
  path: string,
  body?: B,
): Promise<ApiOutcome<T>> {
  return toOutcome(await apiClient.post<T>(path, body));
}

/** PATCH JSON body */
export async function apiPatch<T, B = unknown>(
  path: string,
  body?: B,
): Promise<ApiOutcome<T>> {
  return toOutcome(await apiClient.patch<T>(path, body));
}

/** PUT JSON body */
export async function apiPut<T, B = unknown>(
  path: string,
  body?: B,
): Promise<ApiOutcome<T>> {
  return toOutcome(await apiClient.put<T>(path, body));
}

/** DELETE */
export async function apiDelete<T>(path: string): Promise<ApiOutcome<T>> {
  return toOutcome(await apiClient.delete<T>(path));
}
