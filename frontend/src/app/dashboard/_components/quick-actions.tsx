"use client";

import {
  CalendarPlus,
  FileText,
  type LucideIcon,
  Receipt,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string; // i18n key
  description: string; // i18n key
  href: string;
  icon: LucideIcon;
  tone: "brand" | "sky" | "coral" | "amber";
};

const toneStyles: Record<
  QuickAction["tone"],
  { iconBg: string; iconText: string; ring: string }
> = {
  brand: {
    iconBg: "bg-brand/10",
    iconText: "text-brand",
    ring: "group-hover:ring-brand/40",
  },
  sky: {
    iconBg: "bg-sky-500/10 dark:bg-sky-500/15",
    iconText: "text-sky-600 dark:text-sky-300",
    ring: "group-hover:ring-sky-500/40",
  },
  coral: {
    iconBg: "bg-brand-coral/15",
    iconText: "text-brand-coral",
    ring: "group-hover:ring-brand-coral/40",
  },
  amber: {
    iconBg: "bg-amber-500/12 dark:bg-amber-500/15",
    iconText: "text-amber-600 dark:text-amber-300",
    ring: "group-hover:ring-amber-500/40",
  },
};

const actionDefs: QuickAction[] = [
  {
    label: "quick.addQueue",
    description: "quick.addQueueDesc",
    href: "/dashboard/queue",
    icon: UserPlus,
    tone: "brand",
  },
  {
    label: "quick.book",
    description: "quick.bookDesc",
    href: "/dashboard/calendar",
    icon: CalendarPlus,
    tone: "sky",
  },
  {
    label: "quick.newRx",
    description: "quick.newRxDesc",
    href: "/dashboard/prescriptions",
    icon: FileText,
    tone: "amber",
  },
  {
    label: "quick.newInvoice",
    description: "quick.newInvoiceDesc",
    href: "/dashboard/billing",
    icon: Receipt,
    tone: "coral",
  },
];

export function QuickActions() {
  const { t } = useI18n();
  const actions = useMemo(
    () =>
      actionDefs.map((a) => ({
        ...a,
        labelT: t(a.label),
        descT: t(a.description),
      })),
    [t],
  );
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-card-soft dark:shadow-none">
      <header className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{t("quick.title")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("quick.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map((a) => {
          const styles = toneStyles[a.tone];
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg border border-border bg-background p-3 ring-1 ring-transparent transition-all",
                "hover:bg-muted/30",
                styles.ring,
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  styles.iconBg,
                  styles.iconText,
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {a.labelT}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {a.descT}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
