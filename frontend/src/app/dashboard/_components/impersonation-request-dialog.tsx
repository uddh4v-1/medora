"use client";

import { Check, Loader2, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  approveImpersonationRequest,
  denyImpersonationRequest,
  listPendingImpersonationRequests,
} from "@/services/impersonation-requests.service";
import type { ImpersonationRequest } from "@/services/superadmin.service";

import { useDashboardSession } from "../_hooks/use-dashboard-session";

const POLL_MS = 15_000;

function expiresInMs(iso: string) {
  return new Date(iso).getTime() - Date.now();
}

function formatRemaining(ms: number) {
  if (ms <= 0) return "expiring";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.round(sec / 60);
  return `${min}m`;
}

export function ImpersonationRequestDialog() {
  const { session, isImpersonating } = useDashboardSession();
  const role = session?.role;
  const eligible =
    !!session && !isImpersonating && (role === "Owner" || role === "Doctor");

  const [current, setCurrent] = useState<ImpersonationRequest | null>(null);
  const [responding, setResponding] = useState<"approve" | "deny" | null>(null);
  // Track requests we've shown so we don't re-pop the dialog after the user dismisses.
  const dismissed = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!eligible) return;

    let cancelled = false;

    const poll = async () => {
      const res = await listPendingImpersonationRequests();
      if (cancelled) return;
      if (!res.ok) return;
      const next = res.data.items.find(
        (r) => r.status === "pending" && !dismissed.current.has(r.id),
      );
      setCurrent(next ?? null);
    };

    void poll();
    const id = window.setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [eligible]);

  async function handleApprove() {
    if (!current) return;
    setResponding("approve");
    const res = await approveImpersonationRequest(current.id);
    setResponding(null);
    if (!res.ok) {
      toast.error("Could not approve request");
      return;
    }
    dismissed.current.add(current.id);
    toast.success("Access approved");
    setCurrent(null);
  }

  async function handleDeny() {
    if (!current) return;
    setResponding("deny");
    const res = await denyImpersonationRequest(current.id);
    setResponding(null);
    if (!res.ok) {
      toast.error("Could not deny request");
      return;
    }
    dismissed.current.add(current.id);
    toast.message("Access denied");
    setCurrent(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next && current) {
      // Soft-dismiss: hide the dialog until next decision is needed, but don't
      // resolve the request — clinic owner/doctor can revisit after refresh.
      dismissed.current.add(current.id);
      setCurrent(null);
    }
  }

  const open = !!current;
  const remaining = current ? formatRemaining(expiresInMs(current.expiresAt)) : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30 dark:text-amber-300">
              <ShieldAlert className="size-5" />
            </span>
            <div className="flex flex-col">
              <DialogTitle>SuperAdmin access request</DialogTitle>
              <DialogDescription>
                Approve only if you trust this support session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {current && (
          <div className="flex flex-col gap-3 pt-1">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {current.superAdmin.name || current.superAdmin.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current.superAdmin.email}
                </span>
              </div>
              {current.reason && (
                <p className="mt-2 border-t border-border/70 pt-2 text-xs text-muted-foreground">
                  &quot;{current.reason}&quot;
                </p>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Request expires in {remaining}. Once approved, the SuperAdmin
                can sign in as the clinic Owner for up to 1 hour.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={responding !== null}
                onClick={handleDeny}
                className="gap-1.5"
              >
                {responding === "deny" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
                Deny
              </Button>
              <Button
                type="button"
                disabled={responding !== null}
                onClick={handleApprove}
                className="gap-1.5 bg-brand text-brand-foreground shadow-brand hover:bg-brand/90"
              >
                {responding === "approve" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                Approve
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
