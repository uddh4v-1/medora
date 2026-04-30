import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { requireSuperAdmin } from "@/middleware/require-superadmin.middleware";
import {
  listClinicsHandler,
  getClinicDetailHandler,
  setClinicStatusHandler,
  deleteClinicHandler,
  listUsersHandler,
  setUserStatusHandler,
  forcePasswordResetHandler,
  verifyUserEmailHandler,
  impersonateClinicHandler,
  exitImpersonationHandler,
  getAnalyticsHandler,
  listClinicFlagsHandler,
  updateClinicFlagsHandler,
  getPlatformConfigHandler,
  updatePlatformConfigHandler,
  listBillingHandler,
  extendTrialHandler,
  setBillingStatusHandler,
} from "@/controllers/superadmin.controller";

export const superadminRouter = Router();

// Must be before requireSuperAdmin — during impersonation the JWT role is "Owner", not "SuperAdmin"
superadminRouter.post("/exit-impersonation", asyncHandler(exitImpersonationHandler));

superadminRouter.use(requireSuperAdmin);

superadminRouter.get("/clinics", asyncHandler(listClinicsHandler));
superadminRouter.get("/clinics/:id", asyncHandler(getClinicDetailHandler));
superadminRouter.patch("/clinics/:id/status", asyncHandler(setClinicStatusHandler));
superadminRouter.delete("/clinics/:id", asyncHandler(deleteClinicHandler));

superadminRouter.get("/users", asyncHandler(listUsersHandler));
superadminRouter.patch("/users/:id/status", asyncHandler(setUserStatusHandler));
superadminRouter.post("/users/:id/force-reset", asyncHandler(forcePasswordResetHandler));
superadminRouter.patch("/users/:id/verify-email", asyncHandler(verifyUserEmailHandler));

superadminRouter.post("/clinics/:id/impersonate", asyncHandler(impersonateClinicHandler));

superadminRouter.get("/analytics", asyncHandler(getAnalyticsHandler));

superadminRouter.get("/config/flags", asyncHandler(listClinicFlagsHandler));
superadminRouter.patch("/config/flags/:id", asyncHandler(updateClinicFlagsHandler));
superadminRouter.get("/config/platform", asyncHandler(getPlatformConfigHandler));
superadminRouter.patch("/config/platform", asyncHandler(updatePlatformConfigHandler));

superadminRouter.get("/billing", asyncHandler(listBillingHandler));
superadminRouter.patch("/billing/:id/extend-trial", asyncHandler(extendTrialHandler));
superadminRouter.patch("/billing/:id/status", asyncHandler(setBillingStatusHandler));
