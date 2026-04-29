"use client";

import { type Invoice } from "@/lib/dashboard-content";
import { useClinicStore, useHydrated } from "@/stores/clinic-store";
import { toast } from "sonner";

import { DataListSkeleton } from "@/components/dashboard/data-list-skeleton";
import { createInvoice } from "@/services/invoices.service";
import { patchInvoiceStatus } from "@/services/invoices.service";
import { DashboardPageHeader } from "../_components/page-header";
import { InvoicesTable } from "./_components/invoices-table";
import {
  type NewInvoiceInput,
  NewInvoiceDialog,
} from "./_components/new-invoice-dialog";

export default function BillingPage() {
  const hydrated = useHydrated();
  const invoices = useClinicStore((s) => s.invoices);
  const teamMembers = useClinicStore((s) => s.teamMembers);
  const addInvoice = useClinicStore((s) => s.addInvoice);
  const markInvoicePaid = useClinicStore((s) => s.markInvoicePaid);

  const doctors = teamMembers.filter((m) => m.role === "Doctor");

  async function handleCreate(input: NewInvoiceInput) {
    const doctor = doctors.find((d) => d.id === input.doctorId);
    const res = await createInvoice({
      patientId: input.patientId,
      doctorId: input.doctorId || null,
      total: Math.round(input.total),
      discount: input.discount ? Math.round(input.discount) : null,
      gst: input.gstAmount ? Math.round(input.gstAmount) : null,
      items: input.items.map((it) => ({ label: it.label, amount: Math.round(it.amount) })),
    });
    if (!res.ok) {
      toast.error("Failed to create invoice");
      return;
    }
    const newInvoice: Invoice = {
      id: res.data.id,
      number: res.data.number,
      patient: res.data.patientName,
      total: res.data.total,
      status: "unpaid",
      createdAt: res.data.issuedAt,
      items: res.data.items,
      discount: res.data.discount ?? undefined,
      gst: res.data.gst ?? undefined,
      doctor: doctor?.name ?? res.data.doctorName ?? undefined,
    };
    addInvoice(newInvoice);
    toast.success("Invoice created", {
      description: `${newInvoice.number} · ${newInvoice.patient}`,
    });
  }

  async function handleMarkPaid(id: string) {
    const inv = invoices.find((i) => i.id === id);
    const res = await patchInvoiceStatus(id, "paid");
    if (!res.ok) {
      toast.error("Failed to record payment");
      return;
    }
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
