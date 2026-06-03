import { Router } from "express";

import {
  approveImpersonationRequestHandler,
  denyImpersonationRequestHandler,
  listPendingRequestsHandler,
} from "@/controllers/impersonation-requests.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireRole } from "@/middleware/roles.middleware";
import { asyncHandler } from "@/utils/async-handler";

export const impersonationRequestsRouter = Router();

impersonationRequestsRouter.use(requireAuth);
// Only Owners and Doctors at the clinic can see / respond to requests.
impersonationRequestsRouter.use(requireRole("Owner", "Doctor"));

impersonationRequestsRouter.get(
  "/pending",
  asyncHandler(listPendingRequestsHandler),
);
impersonationRequestsRouter.post(
  "/:id/approve",
  asyncHandler(approveImpersonationRequestHandler),
);
impersonationRequestsRouter.post(
  "/:id/deny",
  asyncHandler(denyImpersonationRequestHandler),
);
