"use client";

import { Clock, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Visit } from "@/lib/dashboard-content";

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function WaitingPanel({
  visits,
  canStart,
  onStart,
}: {
  visits: Visit[];
  canStart: boolean;
  onStart: (id: string) => void;
}) {
  return (
    <aside className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Waiting
        </span>
        <span className="text-[11px] font-medium text-muted-foreground">
          {visits.length}
        </span>
      </div>

      {visits.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-5 text-center text-xs text-muted-foreground">
          Nobody in the queue right now.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visits.map((v, idx) => (
            <li
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  {avatarInitial(v.patient)}
                  <span className="absolute -top-1 -right-1 inline-flex size-4 items-center justify-center rounded-full bg-brand text-[9px] font-semibold text-brand-foreground ring-2 ring-card">
                    {idx + 1}
                  </span>
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-semibold text-foreground">
                    {v.patient}
                  </span>
                  <span className="inline-flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                    <Clock className="size-2.5" />
                    Joined {formatTime(v.startedAt)}
                  </span>
                </div>
              </div>
              {canStart ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onStart(v.id)}
                  className="h-7 gap-1 rounded-md px-2 text-[11px] font-medium text-brand hover:bg-brand/10 hover:text-brand"
                >
                  <PlayCircle className="size-3" />
                  Start
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
