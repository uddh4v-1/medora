import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import {
  getPrescriptions,
  postPrescription,
  getPrescription,
} from "@/controllers/prescriptions.controller";

export const prescriptionsRouter = Router();

prescriptionsRouter.get("/", asyncHandler(getPrescriptions));
prescriptionsRouter.post("/", asyncHandler(postPrescription));
prescriptionsRouter.get("/:prescriptionId", asyncHandler(getPrescription));
