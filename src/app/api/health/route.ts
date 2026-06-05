import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  getProductionReadiness,
  isAmazonConfigured,
  isGeminiConfigured,
  shouldUseAmazonMock,
  shouldUseGeminiMock,
} from "@/lib/env";

export async function GET() {
  try {
    const result = await db.execute(sql`SELECT current_database() AS database`);
    const readiness = getProductionReadiness();
    const readyCount = readiness.filter((item) => item.status === "ready").length;

    return NextResponse.json({
      status: "ok",
      database: result[0]?.database ?? "unknown",
      environment: process.env.NODE_ENV ?? "development",
      integrations: {
        amazon: {
          configured: isAmazonConfigured(),
          mock: shouldUseAmazonMock(),
        },
        gemini: {
          configured: isGeminiConfigured(),
          mock: shouldUseGeminiMock(),
        },
      },
      readiness: {
        score: `${readyCount}/${readiness.length}`,
        checks: readiness,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    return NextResponse.json(
      { status: "error", message },
      { status: 503 },
    );
  }
}
