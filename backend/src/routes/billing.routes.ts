import { Router } from "express";
import { asyncHandler } from "@/utils/async-handler";
import {
  getSubscriptionHandler,
  getBillingConfigHandler,
  createOrderHandler,
  verifyPaymentHandler,
} from "@/controllers/billing.controller";

export const billingRouter = Router();

// No requireActiveSubscription on any billing routes — expired users must be
// able to read their status and pay to reactivate.
billingRouter.get("/subscription", asyncHandler(getSubscriptionHandler));
billingRouter.get("/config", getBillingConfigHandler);
billingRouter.post("/orders", asyncHandler(createOrderHandler));
billingRouter.post("/verify", asyncHandler(verifyPaymentHandler));
