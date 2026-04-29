export type InvoiceItemRow = { id: string; label: string; amount: number };

export type InvoiceRow = {
  id: string;
  number: string;
  total: number;
  status: "paid" | "unpaid";
  discount: number | null;
  gst: number | null;
  issuedAt: string;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string | null;
  items: InvoiceItemRow[];
};

export type CreateInvoiceResponse = InvoiceRow;
