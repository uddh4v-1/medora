import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { postInvoice, patchInvoiceStatus } from "@/controllers/invoices.controller";

export const invoicesRouter = Router();

invoicesRouter.post("/", asyncHandler(postInvoice));
invoicesRouter.patch("/:invoiceId/status", asyncHandler(patchInvoiceStatus));
