import type { Request, Response } from "express";

import { prisma } from "@/lib/prisma";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  let database: "ok" | "unavailable" = "unavailable";
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    database = "ok";
  } catch {
    database = "unavailable";
  }

  res.json({
    ok: true,
    service: "medora-api",
    database,
    ts: new Date().toISOString(),
  });
}
