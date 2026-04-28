import type { Metadata } from "next";

import { ReportsOverview } from "./_components/reports-overview";

export const metadata: Metadata = {
  title: "Reports — Medora",
};

export default function ReportsPage() {
  return <ReportsOverview />;
}
