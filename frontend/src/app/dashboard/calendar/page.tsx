import type { Metadata } from "next";

import { CalendarView } from "./_components/calendar-view";

export const metadata: Metadata = {
  title: "Calendar — Medora",
};

export default function CalendarPage() {
  return <CalendarView initialDate="2026-04-26" />;
}
