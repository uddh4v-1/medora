import { prisma } from "@/lib/prisma";
import { HttpError } from "@/utils/http-error";
import type { CreateInvoiceBody, UpdateInvoiceStatusBody } from "@/schemas/invoices.schemas";

function yyyyMmDd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function asDateStart(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

async function nextInvoiceNumber(clinicId: string): Promise<string> {
  const last = await prisma.invoice.findFirst({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });
  const highest = last
    ? (Number.parseInt(last.number.replace(/^INV-/, ""), 10) || 0)
    : 0;
  return `INV-${(highest + 1).toString().padStart(5, "0")}`;
}

export async function createInvoice(clinicId: string, body: CreateInvoiceBody) {
  const patient = await prisma.patient.findFirst({
    where: { id: body.patientId, clinicId },
    select: { id: true, name: true },
  });
  if (!patient) throw new HttpError(404, "Patient not found", "NOT_FOUND");

  let doctor: { id: string; name: string } | null = null;
  if (body.doctorId) {
    const doc = await prisma.user.findFirst({
      where: { id: body.doctorId, clinicId },
      select: { id: true, name: true },
    });
    if (!doc) throw new HttpError(404, "Doctor not found", "NOT_FOUND");
    doctor = doc;
  }

  const number = await nextInvoiceNumber(clinicId);
  const issuedAt = body.issuedAt ? asDateStart(body.issuedAt) : new Date();

  const inv = await prisma.invoice.create({
    data: {
      clinicId,
      patientId: body.patientId,
      doctorId: body.doctorId ?? null,
      number,
      total: body.total,
      status: "unpaid",
      discount: body.discount ?? null,
      gst: body.gst ?? null,
      issuedAt,
      items: {
        create: body.items.map((i) => ({ label: i.label, amount: i.amount })),
      },
    },
    include: { items: true },
  });

  return {
    id: inv.id,
    number: inv.number,
    total: inv.total,
    status: inv.status,
    discount: inv.discount,
    gst: inv.gst,
    issuedAt: yyyyMmDd(inv.issuedAt),
    patientId: inv.patientId,
    patientName: patient.name,
    doctorId: inv.doctorId,
    doctorName: doctor?.name ?? null,
    items: inv.items.map((i) => ({ id: i.id, label: i.label, amount: i.amount })),
  };
}

export async function updateInvoiceStatus(
  clinicId: string,
  invoiceId: string,
  body: UpdateInvoiceStatusBody,
) {
  const existing = await prisma.invoice.findFirst({
    where: { id: invoiceId, clinicId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Invoice not found", "NOT_FOUND");

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: body.status },
  });
}
