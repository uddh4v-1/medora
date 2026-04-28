import { Router } from "express";

import {
  getMe,
  postLogin,
  postLogout,
  postRegister,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { asyncHandler } from "@/utils/async-handler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(postRegister));
authRouter.post("/login", asyncHandler(postLogin));
authRouter.get("/me", requireAuth, asyncHandler(getMe));
authRouter.post("/logout", asyncHandler(postLogout));
