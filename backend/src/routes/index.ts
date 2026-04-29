import { Router } from "express";

import { authRouter } from "@/routes/auth.routes";
import { healthRouter } from "@/routes/health.routes";
import { requireAuth } from "@/middleware/auth.middleware";
import { dashboardRouter } from "./dashboard.routes";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    message: "Medora API",
    version: "0.1.0",
    docs: "/api/docs",
    openApi: "/api/openapi.json",
    authBase: "/api/auth",
    auth: [
      "POST /register (cookie)",
      "POST /login (cookie)",
      "GET /me",
      "POST /logout",
      "POST /forgot-password",
      "POST /reset-password",
    ],
  });
});

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", requireAuth, dashboardRouter);
