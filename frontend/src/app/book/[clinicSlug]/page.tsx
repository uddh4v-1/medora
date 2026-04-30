import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getClinicBySlug } from "@/services/discover.service";

import { PublicBookingFlow } from "./_components/public-booking-flow";

export const metadata: Metadata = {
  title: "Book an appointment — Medora",
  description:
    "Choose your doctor, pick a time and confirm — your visit is booked.",
};

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;
  const clinic = await getClinicBySlug(clinicSlug);
  if (!clinic) notFound();
  return <PublicBookingFlow clinic={clinic} />;
}
