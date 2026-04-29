import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { postPatient, getPatient, patchPatient } from "@/controllers/patients.controller";

export const patientsRouter = Router();

patientsRouter.post("/", asyncHandler(postPatient));
patientsRouter.get("/:patientId", asyncHandler(getPatient));
patientsRouter.patch("/:patientId", asyncHandler(patchPatient));
