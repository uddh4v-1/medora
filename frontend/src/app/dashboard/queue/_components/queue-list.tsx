"use client";

import { CheckCircle2, Clock, PlayCircle, Stethoscope } from "lucide-react";

import { EmptyQueueIllustration } from "@/components/empty-states/empty-illustrations";
import { Button } from "@/components/ui/button";
import {
  type Visit,
  type VisitStatus,
  visitStatusLabel,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

function formatJoinedTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]!.toUpperCase() : "?";
}

const statusPillStyles: Record<VisitStatus, string> = {
  waiting:
    "bg-amber-500/12 text-amber-700 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
  "in-progress":
    "bg-sky-500/12 text-sky-700 ring-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-400/30",
  completed:
    "bg-emerald-500/12 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
};

const statusIcons: Record<VisitStatus, typeof Clock> = {
  waiting: Clock,
  "in-progress": PlayCircle,
  completed: CheckCircle2,
};

function StatusPill({ status }: { status: VisitStatus }) {
  const Icon = statusIcons[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        statusPillStyles[status],
      )}
    >
      <Icon className="size-3" />
      {visitStatusLabel[status]}
    </span>
  );
}

export function QueueList({
  visits,
  onAdvance,
  onComplete,
}: {
  visits: Visit[];
  onAdvance: (id: string) => void;
  onComplete: (id: string) => void;
}) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <EmptyQueueIllustration className="h-32 w-40" />
        <p className="text-sm font-medium text-foreground">Queue is empty</p>
        <p className="text-xs text-muted-foreground">
          Add the first patient with the “+ Add to queue” button.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {visits.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-3.5 shadow-card-soft transition-colors hover:bg-muted/20 dark:shadow-none"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand"
            >
              {avatarInitial(v.patient)}
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-foreground">
                <span className="truncate">{v.patient}</span>
                <span aria-hidden className="text-muted-foreground">·</span>
                <span className="truncate font-normal text-muted-foreground">
                  {v.reason || v.title}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="size-3" />
                  {v.doctor}
                </span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  Joined {formatJoinedTime(v.startedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StatusPill status={v.status} />
            {v.status === "waiting" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onAdvance(v.id)}
                className="h-8 gap-1 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
              >
                <PlayCircle className="size-3.5" />
                Start
              </Button>
            ) : null}
            {v.status === "in-progress" ? (
              <Button
                type="button"
                size="sm"
                onClick={() => onComplete(v.id)}
                className="h-8 gap-1 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
              >
                <CheckCircle2 className="size-3.5" />
                Complete
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
