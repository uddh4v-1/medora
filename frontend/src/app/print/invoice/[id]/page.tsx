import type { Metadata } from "next";

import { PrintInvoiceView } from "./_components/print-invoice-view";

export const metadata: Metadata = {
  title: "Invoice — Medora",
};

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PrintInvoiceView id={id} />;
}
