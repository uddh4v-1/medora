"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logClientEvent, type ClientAction } from "@/services/audit.service";

/**
 * Provides client-side audit logging.
 * - Automatically fires PAGE_VIEW on every route change.
 * - Returns a stable `log` function for manual events.
 */
export function useAuditLogger() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    logClientEvent("PAGE_VIEW", pathname).catch(() => {});
  }, [pathname]);

  const log = useCallback(
    (action: ClientAction, resource: string, metadata?: Record<string, unknown>) => {
      logClientEvent(action, resource, metadata).catch(() => {});
    },
    [],
  );

  return { log };
}
