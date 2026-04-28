"use client";

import { Stethoscope } from "lucide-react";

import { type Visit, visitStatusLabel } from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

function formatVisitDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  return `${date}, ${time}`;
}

const statusStyles: Record<Visit["status"], string> = {
  waiting: "text-amber-600 dark:text-amber-400",
  "in-progress": "text-sky-600 dark:text-sky-400",
  completed: "text-muted-foreground",
};

export function VisitsList({ visits }: { visits: Visit[] }) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Stethoscope className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">No visits yet</p>
        <p className="text-xs text-muted-foreground">
          Visits will appear here once the patient is checked in.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {visits.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card-soft transition-colors hover:bg-muted/20 dark:shadow-none"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              {v.title}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatVisitDate(v.startedAt)}
            </span>
          </div>
          <span
            className={cn(
              "text-xs font-medium",
              statusStyles[v.status],
            )}
          >
            {visitStatusLabel[v.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
