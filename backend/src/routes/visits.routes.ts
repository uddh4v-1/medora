import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import { postVisit } from "@/controllers/visits.controller";

export const visitsRouter = Router();

visitsRouter.post("/", asyncHandler(postVisit));
