import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { getClinicHandler, patchClinic } from "@/controllers/clinic.controller";
import { requireRole } from "@/middleware/roles.middleware";

export const clinicRouter = Router();

clinicRouter.get("/", asyncHandler(getClinicHandler));
clinicRouter.patch("/", requireRole("Owner"), asyncHandler(patchClinic));
