"use client";

import { ArrowLeft, Printer, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { currentClinic } from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/lib/store";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PrintRxView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const rx = useClinicStore((s) => s.prescriptions.find((r) => r.id === id));
  const patient = useClinicStore((s) =>
    rx ? s.patients.find((p) => p.name === rx.patient) : undefined,
  );

  useEffect(() => {
    if (!rx) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [rx]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading prescription…
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-base font-semibold text-foreground">
          Prescription not found
        </p>
        <Link
          href="/dashboard/prescriptions"
          className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand/80"
        >
          <ArrowLeft className="size-4" />
          Back to prescriptions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-6 pb-4 no-print">
        <Link
          href="/dashboard/prescriptions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to prescriptions
        </Link>
        <Button
          type="button"
          onClick={() => window.print()}
          className="h-9 gap-1.5 rounded-lg bg-brand px-3 text-xs text-brand-foreground hover:bg-brand/90"
        >
          <Printer className="size-3.5" />
          Print
        </Button>
      </div>

      <div className="print-page mx-auto flex max-w-3xl flex-col gap-6 rounded-xl border border-border bg-card p-10 text-foreground shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Stethoscope className="size-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {currentClinic.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {currentClinic.address} · {currentClinic.phone}
              </p>
              {currentClinic.gst ? (
                <p className="text-xs text-muted-foreground">
                  GSTIN: {currentClinic.gst}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Prescription
            </p>
            <p className="text-base font-semibold">{rx.number}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(rx.date)}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Patient
            </p>
            <p className="text-base font-semibold">{rx.patient}</p>
            {patient ? (
              <p className="text-xs text-muted-foreground">
                {patient.phone}
                {patient.age != null ? ` · ${patient.age} yrs` : ""}
                {patient.gender ? ` · ${patient.gender}` : ""}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Doctor
            </p>
            <p className="text-base font-semibold">{rx.doctor}</p>
          </div>
        </section>

        {rx.diagnosis ? (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Diagnosis
            </p>
            <p className="text-sm">{rx.diagnosis}</p>
          </section>
        ) : null}

        <section className="flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Rx
          </p>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Medicine</th>
                <th className="py-2 pr-3 font-semibold">Dosage</th>
                <th className="py-2 pr-3 font-semibold">Frequency</th>
                <th className="py-2 pr-3 font-semibold">Duration</th>
                <th className="py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rx.medications.map((m, i) => (
                <tr
                  key={m.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <td className="py-2 pr-3 font-medium">
                    {i + 1}. {m.name || "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {m.dosage || "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {m.frequency || "—"}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">
                    {m.duration || "—"}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {m.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {rx.notes ? (
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Advice
            </p>
            <p className="text-sm whitespace-pre-line">{rx.notes}</p>
          </section>
        ) : null}

        <footer className="mt-auto flex items-end justify-between border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="max-w-md leading-relaxed">
            This prescription is digitally generated. Please follow the
            advised regimen and consult the doctor if symptoms persist or
            adverse reactions occur.
          </p>
          <div className="text-right">
            <div className="mb-1 h-12 w-44 border-b border-foreground/40" />
            <p className="font-medium text-foreground">{rx.doctor}</p>
            <p className="text-[10px]">Signature</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
