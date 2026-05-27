import { Router } from "express";

import {
  getMe,
  postChangePassword,
  postForgotPassword,
  login,
  postLogout,
  postRefreshToken,
  register,
  postResetPassword,
  postSendVerification,
  postVerifyEmail,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import {
  loginLimiter,
  refreshLimiter,
  commonLimiter,
} from "@/middleware/rate-limit.middleware";
import { asyncHandler } from "@/utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", commonLimiter, asyncHandler(register));
authRouter.post("/login", loginLimiter, asyncHandler(login));
authRouter.get("/me", requireAuth, asyncHandler(getMe));
authRouter.post("/logout", asyncHandler(postLogout));
authRouter.post("/forgot-password", commonLimiter, asyncHandler(postForgotPassword));
authRouter.post("/reset-password", asyncHandler(postResetPassword));
authRouter.post("/refresh", refreshLimiter, asyncHandler(postRefreshToken));
authRouter.post("/send-verification", requireAuth, commonLimiter, asyncHandler(postSendVerification));
authRouter.post("/verify-email", asyncHandler(postVerifyEmail));
authRouter.post("/change-password", requireAuth, asyncHandler(postChangePassword));
