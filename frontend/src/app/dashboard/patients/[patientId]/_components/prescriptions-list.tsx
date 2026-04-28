"use client";

import { Pill } from "lucide-react";

import type { Prescription } from "@/lib/dashboard-content";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PrescriptionsList({
  prescriptions,
}: {
  prescriptions: Prescription[];
}) {
  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Pill className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">
          No prescriptions yet
        </p>
        <p className="text-xs text-muted-foreground">
          Use “New Rx” to create one for this patient.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {prescriptions.map((rx) => (
        <li
          key={rx.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 shadow-card-soft transition-colors hover:bg-muted/20 dark:shadow-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {rx.number} · {rx.diagnosis || "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(rx.date)} · {rx.doctor}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              <Pill className="size-3" />
              {rx.medications.length} med
              {rx.medications.length === 1 ? "" : "s"}
            </span>
          </div>
          {rx.medications.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {rx.medications.map((m) => (
                <li
                  key={m.id}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground"
                >
                  <span className="font-medium">{m.name}</span>
                  {m.dosage ? (
                    <span className="text-muted-foreground">{m.dosage}</span>
                  ) : null}
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{m.frequency}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
