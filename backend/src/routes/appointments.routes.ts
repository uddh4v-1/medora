import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import {
  getAppointments,
  postAppointment,
  patchAppointmentStatus,
} from "@/controllers/appointments.controller";

export const appointmentsRouter = Router();

appointmentsRouter.get("/", asyncHandler(getAppointments));
appointmentsRouter.post("/", asyncHandler(postAppointment));
appointmentsRouter.patch("/:appointmentId/status", asyncHandler(patchAppointmentStatus));
