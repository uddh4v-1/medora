"use client";

import {
  type Invoice,
  nextInvoiceNumber,
} from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";
import { toast } from "sonner";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import { DashboardPageHeader } from "../_components/page-header";
import { InvoicesTable } from "./_components/invoices-table";
import {
  type NewInvoiceInput,
  NewInvoiceDialog,
} from "./_components/new-invoice-dialog";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default function BillingPage() {
  const hydrated = useHydrated();
  const invoices = useClinicStore((s) => s.invoices);
  const addInvoice = useClinicStore((s) => s.addInvoice);
  const markInvoicePaid = useClinicStore((s) => s.markInvoicePaid);

  function handleCreate(input: NewInvoiceInput) {
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      number: nextInvoiceNumber(invoices),
      patient: input.patientName,
      total: input.total,
      status: "unpaid",
      createdAt: todayIso(),
      items: input.items,
      discount: input.discount,
      gst: input.gstAmount,
      doctor: input.doctor,
    };
    addInvoice(newInvoice);
    toast.success("Invoice created", {
      description: `${newInvoice.number} · ${newInvoice.patient}`,
    });
  }

  function handleMarkPaid(id: string) {
    const inv = invoices.find((i) => i.id === id);
    markInvoicePaid(id);
    if (inv) {
      toast.success("Payment recorded", { description: inv.number });
    }
  }

  if (!hydrated) {
    return (
      <div className="px-6 py-6 md:px-8">
        <DataListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-6 py-6 md:px-8">
      <DashboardPageHeader
        eyebrow="Finance"
        title="Billing"
        actions={<NewInvoiceDialog onCreate={handleCreate} />}
      />

      <InvoicesTable invoices={invoices} onMarkPaid={handleMarkPaid} />
    </div>
  );
}
