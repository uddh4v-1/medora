import type { ReactNode } from "react";

import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DashboardTopBar } from "./_components/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <DashboardTopBar />
        {children}
      </main>
    </div>
  );
}
