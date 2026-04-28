"use client";

import { CheckCircle2, Clock, Receipt } from "lucide-react";

import {
  formatCurrency,
  type Invoice,
  type InvoiceStatus,
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

export function BillsList({ bills }: { bills: Invoice[] }) {
  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-card-soft dark:shadow-none">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Receipt className="size-5" />
        </span>
        <p className="text-sm font-medium text-foreground">No bills yet</p>
        <p className="text-xs text-muted-foreground">
          Use “New bill” to create one for this patient.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {bills.map((inv) => {
        const { className, icon: Icon, label } = statusStyles[inv.status];
        return (
          <li
            key={inv.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-card-soft transition-colors hover:bg-muted/20 dark:shadow-none"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {inv.number}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(inv.total)}
              </span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1",
                className,
              )}
            >
              <Icon className="size-3" />
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
