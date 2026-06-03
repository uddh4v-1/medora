import type { ReactNode } from "react";

import { DashboardSessionSync } from "./_components/dashboard-session-sync";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DashboardTopBar } from "./_components/top-bar";
import { ImpersonationBanner } from "./_components/impersonation-banner";
import { ImpersonationRequestDialog } from "./_components/impersonation-request-dialog";
import { PlatformBanner } from "./_components/platform-banner";
import { TrialBanner } from "./_components/trial-banner";
import { TrialExpiredWall } from "./_components/trial-expired-wall";

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
        <TrialBanner />
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <main className="flex flex-1 flex-col overflow-y-auto">
            <DashboardTopBar />
            <TrialExpiredWall>
              {children}
            </TrialExpiredWall>
          </main>
        </div>
        <ImpersonationRequestDialog />
      </div>
    </DashboardSessionSync>
  );
}
