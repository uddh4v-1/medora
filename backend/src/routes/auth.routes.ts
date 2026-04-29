import { Router } from "express";

import {
  getMe,
  postForgotPassword,
  postLogin,
  postLogout,
  postRegister,
  postResetPassword,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(postRegister));
authRouter.post("/login", asyncHandler(postLogin));
authRouter.get("/me", requireAuth, asyncHandler(getMe));
authRouter.post("/logout", asyncHandler(postLogout));
authRouter.post("/forgot-password", asyncHandler(postForgotPassword));
authRouter.post("/reset-password", asyncHandler(postResetPassword));
