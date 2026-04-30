import type { ReactNode } from "react";
import { SuperAdminLogoutButton } from "./_components/superadmin-logout-button";
import { SuperAdminSessionSync } from "./_components/superadmin-session-sync";

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <SuperAdminSessionSync>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-destructive text-xs font-bold text-white">
                SA
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Medora SuperAdmin</p>
                <p className="text-[11px] text-muted-foreground">Platform control panel</p>
              </div>
            </div>
            <nav className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <a href="/superadmin" className="transition-colors hover:text-foreground">
                Overview
              </a>
              <a href="/superadmin/clinics" className="transition-colors hover:text-foreground">
                Clinics
              </a>
              <a href="/superadmin/users" className="transition-colors hover:text-foreground">
                Users
              </a>
              <a href="/superadmin/analytics" className="transition-colors hover:text-foreground">
                Analytics
              </a>
              <a href="/superadmin/config" className="transition-colors hover:text-foreground">
                Config
              </a>
              <a href="/superadmin/billing" className="transition-colors hover:text-foreground">
                Billing
              </a>
              <a href="/superadmin/logs" className="transition-colors hover:text-foreground">
                Audit Logs
              </a>
              <SuperAdminLogoutButton />
            </nav>
          </div>
        </header>
        <main className="px-6 py-8 md:px-10">{children}</main>
      </div>
    </SuperAdminSessionSync>
  );
}
