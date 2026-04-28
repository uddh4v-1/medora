import "dotenv/config";

import { createApp } from "@/app";
import { getEnv } from "@/config/env";
import { prisma } from "@/lib/prisma";

const env = getEnv();
const app = createApp();

const port = env.PORT;

const server = app.listen(port, () => {
  console.log(`medora-backend listening on http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`API docs (Scalar): http://localhost:${port}/api/docs`);
  console.log(`Health (liveness): GET http://localhost:${port}/health`);
  console.log(`Health (DB ping): GET http://localhost:${port}/api/health`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, closing…`);
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
