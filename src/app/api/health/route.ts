import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export function GET() {
  logger.debug({ route: "/api/health" }, "Health check requested");

  return NextResponse.json({
    service: "rifas-online",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
