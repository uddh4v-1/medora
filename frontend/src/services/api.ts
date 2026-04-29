import axios, { type AxiosResponse } from "axios";

import type { ApiOutcome } from "./types/api.types";

export type { ApiOutcome };

/**
 * Medora API client. Base URL from `NEXT_PUBLIC_API_URL`; defaults to
 * `http://localhost:4100`.
 *
 * **`withCredentials: true`** so HttpOnly `medora_session` cookies are sent.
 * **`validateStatus: () => true`** so callers can handle statuses like `fetch`
 * (manual `status`/`ok` checks).
 *
 * @example
 * ```ts
 * const { ok, data } = await apiGet<{ ok: boolean }>("/api/health");
 * if (!ok) return;
 * ```
 */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:4100"
  );
}

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
});

function toOutcome<T>(res: AxiosResponse<T>): ApiOutcome<T> {
  const ok = res.status >= 200 && res.status < 300;
  return { ok, status: res.status, data: (res.data ?? {}) as T };
}

/** GET — `const { ok, data } = await apiGet<User>("/api/auth/me");` */
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
