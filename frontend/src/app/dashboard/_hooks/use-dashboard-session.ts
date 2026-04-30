"use client";

import { useMemo } from "react";

import {
  currentClinic,
  currentUser,
} from "@/lib/dashboard-content";
import { useClinicStore } from "@/stores/clinic-store";
import type { Session } from "@/stores/clinic-store";

const HONORIFIC = new Set([
  "dr",
  "doctor",
  "mr",
  "mrs",
  "ms",
  "miss",
  "prof",
  "professor",
  "shri",
  "smt",
]);

function normalizedTokenKey(token: string): string {
  return token.replace(/\.+$/g, "").toLowerCase();
}

/** Words with honorific prefixes removed. */
function namePartsWithoutHonorifics(fullName: string): string[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.filter((raw) => !HONORIFIC.has(normalizedTokenKey(raw)));
}

function initialsFromName(name: string | undefined): string {
  const n = (name ?? "").trim();
  if (!n) return currentUser.initials;
  const parts = namePartsWithoutHonorifics(n);
  if (parts.length >= 2) {
    const a = parts[0]![0];
    const b = parts[parts.length - 1]![0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

function firstNonHonorificToken(fullName: string): string | null {
  const parts = namePartsWithoutHonorifics(fullName);
  const first = parts[0];
  return first ? first.replace(/\.+$/g, "") : null;
}

function shortNameFromSession(session: Session | null): string {
  const name = session?.name?.trim();
  if (name) {
    const given = firstNonHonorificToken(name);
    if (given) return given;
  }
  const email = session?.email?.trim();
  if (email?.includes("@")) {
    const local = email.split("@")[0] ?? "";
    const segment = local.split(/[.+_-]/)[0] ?? "";
    if (segment.length >= 2 && /^[a-zA-Z]+$/.test(segment)) {
      return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
    }
  }
  return currentUser.shortName;
}

/** Session + dashboard display fields (real `/me` / login user, else demo placeholders). */
export function useDashboardSession() {
  const session = useClinicStore((s) => s.session);

  return useMemo(
    () => ({
      session,
      clinicName: session?.clinic?.name ?? currentClinic.name,
      clinicSlug: session?.clinic?.slug,
      clinicId: session?.clinic?.id,
      displayName:
        session?.name?.trim() || session?.email?.trim() || currentUser.name,
      shortName: shortNameFromSession(session),
      initials: initialsFromName(session?.name),
      roleLabel: session?.role ?? currentUser.role,
      email: session?.email ?? null,
      isImpersonating: session?.isImpersonating ?? false,
    }),
    [session],
  );
}
