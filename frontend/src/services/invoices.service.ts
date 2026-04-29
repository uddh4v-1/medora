import { apiPost, apiPatch } from "./api";
import type { CreateInvoiceResponse } from "./types/invoices.types";

const BASE = "/api/invoices";

export type CreateInvoiceItemInput = {
  label: string;
  amount: number;
};

export type CreateInvoiceInput = {
  patientId: string;
  doctorId?: string | null;
  issuedAt?: string;
  total: number;
  discount?: number | null;
  gst?: number | null;
  items: CreateInvoiceItemInput[];
};

export async function createInvoice(input: CreateInvoiceInput) {
  return apiPost<CreateInvoiceResponse, CreateInvoiceInput>(BASE, input);
}

export async function patchInvoiceStatus(invoiceId: string, status: "paid" | "unpaid") {
  return apiPatch<{ ok: boolean }, { status: string }>(
    `${BASE}/${invoiceId}/status`,
    { status },
  );
}
