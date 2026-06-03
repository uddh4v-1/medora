import { apiGet, apiPost } from "./api";
import type {
  ImpersonationRequest,
  ImpersonationRequestListResponse,
} from "./superadmin.service";

const BASE = "/api/impersonation-requests";

/** Clinic-side (Owner/Doctor): list pending requests for our clinic. */
export function listPendingImpersonationRequests() {
  return apiGet<ImpersonationRequestListResponse>(`${BASE}/pending`);
}

/** Clinic-side (Owner/Doctor): approve a pending request. */
export function approveImpersonationRequest(requestId: string) {
  return apiPost<ImpersonationRequest, Record<string, never>>(
    `${BASE}/${requestId}/approve`,
    {},
  );
}

/** Clinic-side (Owner/Doctor): deny a pending request. */
export function denyImpersonationRequest(requestId: string) {
  return apiPost<ImpersonationRequest, Record<string, never>>(
    `${BASE}/${requestId}/deny`,
    {},
  );
}
