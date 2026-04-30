import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { SuperAdminLogoutButton } from "./_components/superadmin-logout-button";
import { SuperAdminSearch } from "./_components/superadmin-search";
import { SuperAdminSessionSync } from "./_components/superadmin-session-sync";

const navGroups = [
  {
    label: "Core",
    items: [
      { label: "Overview", href: "/superadmin" },
      { label: "Clinics", href: "/superadmin/clinics" },
      { label: "Users", href: "/superadmin/users" },
      { label: "Admins", href: "/superadmin/admins" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Financial", href: "/superadmin/financial" },
      { label: "Billing", href: "/superadmin/billing" },
      { label: "Payments", href: "/superadmin/payments" },
      { label: "Custom Plans", href: "/superadmin/custom-plans" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Onboarding", href: "/superadmin/onboarding" },
      { label: "Tickets", href: "/superadmin/tickets" },
      { label: "Broadcasts", href: "/superadmin/broadcasts" },
    ],
  },
  {
    label: "Monitor",
    items: [
      { label: "Analytics", href: "/superadmin/analytics" },
      { label: "Health", href: "/superadmin/health" },
      { label: "Sys Health", href: "/superadmin/system-health" },
      { label: "API Usage", href: "/superadmin/api-usage" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "GDPR", href: "/superadmin/gdpr" },
      { label: "Config", href: "/superadmin/config" },
      { label: "Audit Logs", href: "/superadmin/logs" },
    ],
  },
];

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <SuperAdminSessionSync>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded bg-destructive text-[10px] font-bold text-white">
              SA
            </span>
            <span className="text-sm font-semibold text-foreground">SuperAdmin</span>
          </div>
          <div className="flex items-center gap-2">
            <SuperAdminSearch />
            <ThemeToggle />
            <SuperAdminLogoutButton />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card">
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block rounded px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1 overflow-auto px-8 py-8">{children}</main>
        </div>
      </div>
    </SuperAdminSessionSync>
  );
}
