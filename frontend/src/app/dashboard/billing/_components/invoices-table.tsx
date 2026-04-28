"use client";

import { CheckCircle2, Clock, Printer } from "lucide-react";
import Link from "next/link";

import { EmptyBillingIllustration } from "@/components/empty-states/empty-illustrations";
import { Button } from "@/components/ui/button";
import {
  type Invoice,
  type InvoiceStatus,
  formatCurrency,
} from "@/lib/dashboard-content";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  InvoiceStatus,
  { className: string; icon: typeof CheckCircle2; label: string }
> = {
  paid: {
    className:
      "bg-emerald-500/12 text-emerald-700 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30",
    icon: CheckCircle2,
    label: "paid",
  },
  unpaid: {
    className:
      "bg-amber-500/12 text-amber-700 ring-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    icon: Clock,
    label: "unpaid",
  },
};

function StatusPill({ status }: { status: InvoiceStatus }) {
  const { className, icon: Icon, label } = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
        className,
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export function InvoicesTable({
  invoices,
  onMarkPaid,
}: {
  invoices: Invoice[];
  onMarkPaid?: (id: string) => void;
}) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <EmptyBillingIllustration className="h-32 w-40" />
        <p className="text-sm font-medium text-foreground">No invoices yet</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          When you create bills from Billing or a patient file, they will appear
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card-soft dark:shadow-none">
      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_180px] items-center gap-4 bg-muted/40 px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>Invoice</span>
        <span>Patient</span>
        <span>Total</span>
        <span>Status</span>
        <span aria-hidden />
      </div>
      <ul className="divide-y divide-border/60">
        {invoices.map((invoice) => (
          <li
            key={invoice.id}
            className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_180px] items-center gap-4 px-5 py-3.5 text-sm transition-colors hover:bg-muted/20"
          >
            <span className="truncate font-semibold text-foreground">
              {invoice.number}
            </span>
            <span className="truncate text-muted-foreground">
              {invoice.patient}
            </span>
            <span className="text-foreground">
              {formatCurrency(invoice.total)}
            </span>
            <span>
              <StatusPill status={invoice.status} />
            </span>
            <span className="flex items-center justify-end gap-1.5">
              {invoice.status === "unpaid" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onMarkPaid?.(invoice.id)}
                  className="h-8 rounded-md bg-brand px-3 text-xs font-medium text-brand-foreground shadow-brand hover:bg-brand/90"
                >
                  Mark paid
                </Button>
              ) : null}
              <Button
                asChild
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Print ${invoice.number}`}
                className="size-8 rounded-md p-0 text-muted-foreground hover:text-foreground"
              >
                <Link href={`/print/invoice/${invoice.id}`} target="_blank">
                  <Printer className="size-4" />
                </Link>
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
