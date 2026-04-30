import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import {
  exportClinicDataHandler,
  getClinicHandler,
  getLocations,
  patchClinic,
  postCreateBranch,
  postSwitchLocation,
} from "@/controllers/clinic.controller";
import { requireRole } from "@/middleware/roles.middleware";

export const clinicRouter = Router();

clinicRouter.get("/", asyncHandler(getClinicHandler));
clinicRouter.patch("/", requireRole("Owner"), asyncHandler(patchClinic));
clinicRouter.get("/export", requireRole("Owner"), asyncHandler(exportClinicDataHandler));

// Multi-location — Owner only
clinicRouter.get("/locations", requireRole("Owner"), asyncHandler(getLocations));
clinicRouter.post("/locations", requireRole("Owner"), asyncHandler(postCreateBranch));
clinicRouter.post("/locations/switch", requireRole("Owner"), asyncHandler(postSwitchLocation));
