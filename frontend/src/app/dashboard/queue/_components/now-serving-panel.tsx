"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  PlayCircle,
  Stethoscope,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Visit } from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

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

function elapsedSince(iso: string) {
  const start = new Date(iso).getTime();
  const now = Date.now();
  const minutes = Math.max(0, Math.round((now - start) / 60000));
  if (minutes < 1) return "just started";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function NowServingPanel({
  visit,
  nextVisit,
  onComplete,
  onStartNext,
  className,
}: {
  visit: Visit | null;
  nextVisit: Visit | null;
  onComplete: (id: string) => void;
  onStartNext: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 overflow-hidden rounded-2xl bg-brand p-6 text-brand-foreground shadow-brand-lg",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/8 blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-white/5 blur-2xl"
      />

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-foreground/70">
          Now serving
        </span>
        {visit ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-brand-foreground/85">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
            Live
          </span>
        ) : null}
      </div>

      {visit ? (
        <>
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-semibold text-brand-foreground ring-1 ring-white/20">
              {avatarInitial(visit.patient)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h3 className="truncate text-2xl font-semibold tracking-tight text-brand-foreground">
                {visit.patient}
              </h3>
              <p className="truncate text-sm text-brand-foreground/85">
                {visit.reason || visit.title}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Stethoscope className="size-3.5" />
              {visit.doctor}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle className="size-3.5" />
              Started at {formatTime(visit.startedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              In progress · {elapsedSince(visit.startedAt)}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={() => onComplete(visit.id)}
              className="h-9 gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-brand shadow-sm hover:bg-white/90"
            >
              <CheckCircle2 className="size-4" />
              Mark complete
            </Button>
            {nextVisit ? (
              <span className="inline-flex items-center gap-1 text-xs text-brand-foreground/70">
                Next up: {nextVisit.patient}
              </span>
            ) : null}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10 text-brand-foreground/70 ring-1 ring-white/15">
              <span className="block h-1 w-6 rounded-full bg-current" />
            </span>
            <p className="text-sm text-brand-foreground/85">
              {nextVisit
                ? "No patient being seen. Start the next one →"
                : "No patient being seen, and the queue is empty."}
            </p>
          </div>
          {nextVisit ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => onStartNext(nextVisit.id)}
                className="h-9 gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-brand shadow-sm hover:bg-white/90"
              >
                <PlayCircle className="size-4" />
                Start next
                <ArrowRight className="size-3.5" />
              </Button>
              <span className="inline-flex items-center gap-1 text-xs text-brand-foreground/75">
                {nextVisit.patient} · {nextVisit.reason || nextVisit.title}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
