import { Router } from "express";

import { authRouter } from "@/routes/auth.routes";
import { healthRouter } from "@/routes/health.routes";
import { requireAuth } from "@/middleware/auth.middleware";
import { auditMiddleware } from "@/middleware/audit.middleware";
import { requireActiveSubscription } from "@/middleware/subscription.middleware";
import { dashboardRouter } from "./dashboard.routes";
import { patientsRouter } from "./patients.routes";
import { visitsRouter } from "./visits.routes";
import { appointmentsRouter } from "./appointments.routes";
import { prescriptionsRouter } from "./prescriptions.routes";
import { invoicesRouter } from "./invoices.routes";
import { teamRouter } from "./team.routes";
import { clinicRouter } from "./clinic.routes";
import { auditRouter } from "./audit.routes";
import { superadminRouter } from "./superadmin.routes";
import { billingRouter } from "./billing.routes";
import { discoverRouter } from "./discover.routes";
import { notificationsRouter } from "./notifications.routes";
import { getPlatformConfig, getPublicPlans } from "@/services/superadmin.service";

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
apiRouter.use("/discover", discoverRouter);

apiRouter.get("/config", async (_req, res) => {
  const config = await getPlatformConfig();
  res.json(config);
});

apiRouter.get("/plans", async (_req, res) => {
  res.json(await getPublicPlans());
});

apiRouter.use("/dashboard", requireAuth, requireActiveSubscription, auditMiddleware, dashboardRouter);
apiRouter.use("/patients", requireAuth, requireActiveSubscription, auditMiddleware, patientsRouter);
apiRouter.use("/visits", requireAuth, requireActiveSubscription, auditMiddleware, visitsRouter);
apiRouter.use("/appointments", requireAuth, requireActiveSubscription, auditMiddleware, appointmentsRouter);
apiRouter.use("/prescriptions", requireAuth, requireActiveSubscription, auditMiddleware, prescriptionsRouter);
apiRouter.use("/invoices", requireAuth, requireActiveSubscription, auditMiddleware, invoicesRouter);
apiRouter.use("/team", requireAuth, requireActiveSubscription, auditMiddleware, teamRouter);
apiRouter.use("/clinic", requireAuth, requireActiveSubscription, auditMiddleware, clinicRouter);
apiRouter.use("/audit", requireAuth, requireActiveSubscription, auditRouter);
apiRouter.use("/notifications", requireAuth, requireActiveSubscription, auditMiddleware, notificationsRouter);
apiRouter.use("/billing", requireAuth, billingRouter);
apiRouter.use("/superadmin", requireAuth, superadminRouter);
