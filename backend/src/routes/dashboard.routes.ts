import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import {
  getDashboardOverview,
  getPatients,
  getQueue,
  patchQueueStatus,
  getInvoices,
  getRevenueSummary,
  getReportsOverview,
} from "@/controllers/dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", asyncHandler(getDashboardOverview));
dashboardRouter.get("/patients", asyncHandler(getPatients));
dashboardRouter.get("/queue", asyncHandler(getQueue));
dashboardRouter.patch("/queue/:visitId/status", asyncHandler(patchQueueStatus));
dashboardRouter.get("/invoices", asyncHandler(getInvoices));
dashboardRouter.get("/revenue/summary", asyncHandler(getRevenueSummary));
dashboardRouter.get("/reports", asyncHandler(getReportsOverview));