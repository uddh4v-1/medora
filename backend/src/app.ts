import { apiReference } from "@scalar/express-api-reference";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { getEnv } from "@/config/env";
import { getOpenApiSpec } from "@/openapi/spec";
import { errorMiddleware } from "@/middleware/error.middleware";
import { notFoundMiddleware } from "@/middleware/not-found.middleware";
import { apiRouter } from "@/routes";

export function createApp() {
  const env = getEnv();

  const app = express();

  /** Scalar loads `@scalar/api-reference` from jsDelivr; default Helmet CSP blocks it (blank docs). */
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          "style-src": ["'self'", "https:", "'unsafe-inline'"],
          "img-src": ["'self'", "data:", "blob:", "https:"],
          "font-src": ["'self'", "https:", "data:"],
          "connect-src": ["'self'", "https://cdn.jsdelivr.net"],
        },
      },
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  const allowed = env.CORS_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }
        if (!allowed?.length && env.NODE_ENV === "development") {
          cb(null, true);
          return;
        }
        if (!allowed?.length) {
          cb(null, false);
          return;
        }
        cb(null, allowed.includes(origin));
      },
      credentials: true,
    }),
  );

  /** Interactive API docs (Scalar) — mounted before `/api` router */
  app.get("/api/openapi.json", (_req, res) => {
    res.json(getOpenApiSpec());
  });
  app.use(
    "/api/docs",
    apiReference({
      title: "Medora API",
      url: "/api/openapi.json",
    }),
  );

  app.use("/api", apiRouter);

  /** Liveness (no DB required) — use for load balancers */
  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "medora-api", ts: new Date().toISOString() });
  });

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
