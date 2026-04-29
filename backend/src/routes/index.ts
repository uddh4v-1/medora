import { Router } from "express";

import { authRouter } from "@/routes/auth.routes";
import { healthRouter } from "@/routes/health.routes";
import { requireAuth } from "@/middleware/auth.middleware";
import { auditMiddleware } from "@/middleware/audit.middleware";
import { dashboardRouter } from "./dashboard.routes";
import { patientsRouter } from "./patients.routes";
import { visitsRouter } from "./visits.routes";
import { appointmentsRouter } from "./appointments.routes";
import { prescriptionsRouter } from "./prescriptions.routes";
import { invoicesRouter } from "./invoices.routes";
import { teamRouter } from "./team.routes";
import { clinicRouter } from "./clinic.routes";
import { auditRouter } from "./audit.routes";

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

apiRouter.use("/dashboard", requireAuth, auditMiddleware, dashboardRouter);
apiRouter.use("/patients", requireAuth, auditMiddleware, patientsRouter);
apiRouter.use("/visits", requireAuth, auditMiddleware, visitsRouter);
apiRouter.use("/appointments", requireAuth, auditMiddleware, appointmentsRouter);
apiRouter.use("/prescriptions", requireAuth, auditMiddleware, prescriptionsRouter);
apiRouter.use("/invoices", requireAuth, auditMiddleware, invoicesRouter);
apiRouter.use("/team", requireAuth, auditMiddleware, teamRouter);
apiRouter.use("/clinic", requireAuth, auditMiddleware, clinicRouter);
apiRouter.use("/audit", requireAuth, auditRouter);
