import type { ReactNode } from "react";

import { DashboardSessionSync } from "./_components/dashboard-session-sync";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DashboardTopBar } from "./_components/top-bar";
import { ImpersonationBanner } from "./_components/impersonation-banner";
import { PlatformBanner } from "./_components/platform-banner";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <DashboardSessionSync>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <PlatformBanner />
        <ImpersonationBanner />
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <main className="flex flex-1 flex-col overflow-y-auto">
            <DashboardTopBar />
            {children}
          </main>
        </div>
      </div>
    </DashboardSessionSync>
  );
}
