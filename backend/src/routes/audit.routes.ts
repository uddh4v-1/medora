import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireSuperAdmin } from "@/middleware/require-superadmin.middleware";
import {
  postAuditEvent,
  getAuditLogsHandler,
  getSuperAdminStatsHandler,
} from "@/controllers/audit.controller";

export const auditRouter = Router();

// Any authenticated user can post client-side events (page views, clicks)
auditRouter.post("/event", asyncHandler(postAuditEvent));

// SuperAdmin-only: view logs and stats
auditRouter.get("/logs", requireSuperAdmin, asyncHandler(getAuditLogsHandler));
auditRouter.get("/stats", requireSuperAdmin, asyncHandler(getSuperAdminStatsHandler));
