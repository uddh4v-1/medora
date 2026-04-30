import type { Metadata } from "next";

import { CalendarView } from "./_components/calendar-view";

export const metadata: Metadata = {
  title: "Calendar — Medora",
};

export default function CalendarPage() {
  const today = new Date().toISOString().slice(0, 10);
  return <CalendarView initialDate={today} />;
}
