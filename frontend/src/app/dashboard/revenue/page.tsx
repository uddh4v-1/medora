import type { Metadata } from "next";

import { RevenueOverview } from "./_components/revenue-overview";

export const metadata: Metadata = {
  title: "Revenue — Medora",
};

export default function RevenuePage() {
  return <RevenueOverview />;
}
