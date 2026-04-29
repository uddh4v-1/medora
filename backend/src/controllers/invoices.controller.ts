import type { Request, Response } from "express";
import { HttpError } from "@/utils/http-error";
import {
  createInvoiceBodySchema,
  invoiceIdParamSchema,
  updateInvoiceStatusBodySchema,
} from "@/schemas/invoices.schemas";
import { createInvoice, updateInvoiceStatus } from "@/services/invoices.service";

function requireClinicId(req: Request): string {
  const clinicId = req.auth?.clinicId;
  if (!clinicId) throw new HttpError(401, "Not authenticated", "UNAUTHORIZED");
  return clinicId;
}

export async function postInvoice(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const parsed = createInvoiceBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  const data = await createInvoice(clinicId, parsed.data);
  res.status(201).json(data);
}

export async function patchInvoiceStatus(req: Request, res: Response): Promise<void> {
  const clinicId = requireClinicId(req);
  const params = invoiceIdParamSchema.safeParse(req.params);
  if (!params.success) {
    throw new HttpError(400, "Invalid invoice id", "VALIDATION_ERROR");
  }
  const parsed = updateInvoiceStatusBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid body", "VALIDATION_ERROR");
  }
  await updateInvoiceStatus(clinicId, params.data.invoiceId, parsed.data);
  res.status(200).json({ ok: true });
}
