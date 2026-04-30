"use client";

import {
  BarChart2,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Lock,
  Megaphone,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Stethoscope,
  Ticket,
  Users,
  Zap,
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

const groups = [
  {
    label: "Core",
    items: [
      { label: "Overview", href: "/superadmin", icon: LayoutDashboard },
      { label: "Clinics", href: "/superadmin/clinics", icon: Building2 },
      { label: "Users", href: "/superadmin/users", icon: Users },
      { label: "Admins", href: "/superadmin/admins", icon: ShieldCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Financial", href: "/superadmin/financial", icon: IndianRupee },
      { label: "Billing", href: "/superadmin/billing", icon: CreditCard },
      { label: "Payments", href: "/superadmin/payments", icon: CreditCard },
      { label: "Custom Plans", href: "/superadmin/custom-plans", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Onboarding", href: "/superadmin/onboarding", icon: ClipboardList },
      { label: "Tickets", href: "/superadmin/tickets", icon: Ticket },
      { label: "Broadcasts", href: "/superadmin/broadcasts", icon: Megaphone },
    ],
  },
  {
    label: "Monitor",
    items: [
      { label: "Analytics", href: "/superadmin/analytics", icon: BarChart2 },
      { label: "Health", href: "/superadmin/health", icon: Stethoscope },
      { label: "Sys Health", href: "/superadmin/system-health", icon: Server },
      { label: "API Usage", href: "/superadmin/api-usage", icon: Zap },
    ],
  },
  {
    label: "System",
    items: [
      { label: "GDPR", href: "/superadmin/gdpr", icon: Lock },
      { label: "Config", href: "/superadmin/config", icon: Settings },
      { label: "Audit Logs", href: "/superadmin/logs", icon: FileText },
    ],
  },
];

export function SuperAdminSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
        className="relative h-9 gap-2 rounded-lg border border-border/80 bg-card px-2.5 text-left text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground md:min-w-50 md:pl-2.5"
        aria-label="Open search"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 sm:inline">Search…</span>
        <kbd className="hidden rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
          {typeof navigator !== "undefined" && navigator.platform.includes("Mac")
            ? "⌘K"
            : "Ctrl K"}
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search admin pages</DialogTitle>
        <Command>
          <CommandInput placeholder="Search pages…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {groups.map((group, i) => (
              <>
                {i > 0 && <CommandSeparator key={`sep-${group.label}`} />}
                <CommandGroup key={group.label} heading={group.label}>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.href}
                        value={`${item.label} ${group.label} ${item.href}`}
                        onSelect={() => go(item.href)}
                      >
                        <Icon className="size-4" />
                        <span className="flex-1 truncate">{item.label}</span>
                        <CommandShortcut>Go</CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
