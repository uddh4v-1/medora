"use client";

import { ArrowLeft, Printer, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { currentClinic, formatCurrency } from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function PrintInvoiceView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const inv = useClinicStore((s) => s.invoices.find((i) => i.id === id));
  const patient = useClinicStore((s) =>
    inv ? s.patients.find((p) => p.name === inv.patient) : undefined,
  );

  useEffect(() => {
    if (!inv) return;
    const t = window.setTimeout(() => window.print(), 600);
    return () => window.clearTimeout(t);
  }, [inv]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading invoice…
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-base font-semibold text-foreground">
          Invoice not found
        </p>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-sm text-brand hover:text-brand/80"
        >
          <ArrowLeft className="size-4" />
          Back to billing
        </Link>
      </div>
    );
  }

  const items = inv.items ?? [
    { id: "default", label: "Consultation", amount: inv.total },
  ];
  const subtotal = items.reduce((acc, it) => acc + it.amount, 0);
  const discount = inv.discount ?? 0;
  const gst = inv.gst ?? 0;

  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-6 pb-4 no-print">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to billing
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
              Tax invoice
            </p>
            <p className="text-base font-semibold">{inv.number}</p>
            {inv.createdAt ? (
              <p className="text-xs text-muted-foreground">
                {formatDate(inv.createdAt)}
              </p>
            ) : null}
            <p
              className={
                inv.status === "paid"
                  ? "mt-1 inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700"
                  : "mt-1 inline-block rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700"
              }
            >
              {inv.status}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-sm">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Billed to
            </p>
            <p className="text-base font-semibold">{inv.patient}</p>
            {patient ? (
              <p className="text-xs text-muted-foreground">
                {patient.phone}
                {patient.address ? ` · ${patient.address}` : ""}
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Doctor
            </p>
            <p className="text-base font-semibold">{inv.doctor || "—"}</p>
          </div>
        </section>

        <section>
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Description</th>
                <th className="py-2 pl-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <td className="py-2 pr-3 font-medium">{it.label}</td>
                  <td className="py-2 pl-3 text-right">
                    {formatCurrency(it.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="ml-auto flex w-full max-w-xs flex-col gap-1.5 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Discount</span>
              <span className="text-foreground">
                −{formatCurrency(discount)}
              </span>
            </div>
          ) : null}
          {gst > 0 ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>GST</span>
              <span className="text-foreground">{formatCurrency(gst)}</span>
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrency(inv.total)}</span>
          </div>
        </section>

        <footer className="mt-auto flex items-end justify-between border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="max-w-md leading-relaxed">
            Thank you for your visit. Payment received in good order.
            For any clarification, please contact us at {currentClinic.phone}.
          </p>
          <div className="text-right">
            <div className="mb-1 h-12 w-44 border-b border-foreground/40" />
            <p className="font-medium text-foreground">{currentClinic.name}</p>
            <p className="text-[10px]">Authorized signature</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
