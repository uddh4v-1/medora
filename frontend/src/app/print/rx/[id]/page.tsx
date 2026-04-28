import type { Metadata } from "next";

import { PrintRxView } from "./_components/print-rx-view";

export const metadata: Metadata = {
  title: "Prescription — Medora",
};

export default async function PrintRxPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrintRxView id={id} />;
}
