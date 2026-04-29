import { Router } from "express";

import {
  getMe,
  postChangePassword,
  postForgotPassword,
  postLogin,
  postLogout,
  postRefreshToken,
  postRegister,
  postResetPassword,
  postSendVerification,
  postVerifyEmail,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import {
  forgotPasswordLimiter,
  loginLimiter,
  refreshLimiter,
  registerLimiter,
  sendVerificationLimiter,
} from "@/middleware/rate-limit.middleware";
import { asyncHandler } from "@/utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", registerLimiter, asyncHandler(postRegister));
authRouter.post("/login", loginLimiter, asyncHandler(postLogin));
authRouter.get("/me", requireAuth, asyncHandler(getMe));
authRouter.post("/logout", asyncHandler(postLogout));
authRouter.post("/forgot-password", forgotPasswordLimiter, asyncHandler(postForgotPassword));
authRouter.post("/reset-password", asyncHandler(postResetPassword));
authRouter.post("/refresh", refreshLimiter, asyncHandler(postRefreshToken));
authRouter.post("/send-verification", requireAuth, sendVerificationLimiter, asyncHandler(postSendVerification));
authRouter.post("/verify-email", asyncHandler(postVerifyEmail));
authRouter.post("/change-password", requireAuth, asyncHandler(postChangePassword));
