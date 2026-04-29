"use client";

import {
  BarChart2,
  CalendarDays,
  CreditCard,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  Megaphone,
  Pill,
  Search,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { currentClinic, dashboardNav } from "@/lib/dashboard-content";
import { useI18n } from "@/lib/i18n/provider";
import { useClinicStore } from "@/stores/clinic-store";

const navIconMap: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/queue": ListOrdered,
  "/dashboard/calendar": CalendarDays,
  "/dashboard/patients": Users,
  "/dashboard/prescriptions": Pill,
  "/dashboard/billing": CreditCard,
  "/dashboard/revenue": LineChart,
  "/dashboard/reports": BarChart2,
  "/dashboard/notifications": Megaphone,
  "/dashboard/settings": Settings,
};

export function CommandPalette() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const patients = useClinicStore((s) => s.patients);
  const prescriptions = useClinicStore((s) => s.prescriptions);
  const invoices = useClinicStore((s) => s.invoices);
  const visits = useClinicStore((s) => s.visits);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(true)}
        className="relative h-9 gap-2 rounded-lg border border-border/80 bg-card px-2.5 text-left text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground md:min-w-[200px] md:pl-2.5"
        aria-label={t("cmd.ariaOpen")}
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 sm:inline">{t("cmd.searchBox")}</span>
        <kbd className="hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          {typeof navigator !== "undefined" && navigator.platform.includes("Mac")
            ? "⌘K"
            : "Ctrl K"}
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">{t("cmd.title")}</DialogTitle>
        <Command>
          <CommandInput placeholder={t("cmd.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("cmd.noResults")}</CommandEmpty>
            <CommandGroup heading={t("cmd.pages")}>
              {[
                {
                  href: `/book/${currentClinic.slug}`,
                  label: t("cmd.publicBooking"),
                },
                ...dashboardNav.map((i) => ({
                  href: i.href,
                  label: t(i.i18nKey),
                })),
              ].map((item) => {
                const Icon = navIconMap[item.href] ?? Stethoscope;
                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.href} page nav`}
                    onSelect={() => go(item.href)}
                  >
                    <Icon className="size-4" />
                    <span className="flex-1 truncate">{item.label}</span>
                    <CommandShortcut>{t("cmd.go")}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />
            <CommandGroup heading={t("cmd.patients")}>
              {patients.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.phone} patient`}
                  onSelect={() => go(`/dashboard/patients/${p.id}`)}
                >
                  <Users className="size-4" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {p.phone}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("cmd.prescriptions")}>
              {prescriptions.slice(0, 20).map((rx) => (
                <CommandItem
                  key={rx.id}
                  value={`${rx.number} ${rx.patient} ${rx.doctor} prescription`}
                  onSelect={() => go("/dashboard/prescriptions")}
                >
                  <FileText className="size-4" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-mono text-xs">
                      {rx.number}
                    </span>
                    <span className="truncate text-sm">{rx.patient}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("cmd.invoices")}>
              {invoices.map((inv) => (
                <CommandItem
                  key={inv.id}
                  value={`${inv.number} ${inv.patient} ${inv.status} invoice bill`}
                  onSelect={() => go("/dashboard/billing")}
                >
                  <IndianRupee className="size-4" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-mono text-xs">
                      {inv.number}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {inv.patient} · {inv.status}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading={t("cmd.queue")}>
              {visits.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`${v.patient} ${v.doctor} visit queue ${v.status}`}
                  onSelect={() => go("/dashboard/queue")}
                >
                  <ListOrdered className="size-4" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{v.patient}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {v.status} · {v.doctor}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
