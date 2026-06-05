import { NextResponse } from "next/server";

import { verifyJobAuth } from "@/lib/jobs/auth";
import { generateReviewsForQueue } from "@/lib/jobs/content-generation";
import { ingestActiveCampaigns } from "@/lib/jobs/product-ingestion";
import { refreshProductPrices } from "@/lib/jobs/price-refresh";

export const maxDuration = 300;

export async function GET(request: Request) {
  if (!verifyJobAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const results: Record<string, unknown> = {};

  try {
    results.ingest = await ingestActiveCampaigns();
  } catch (error) {
    results.ingest = {
      status: "error",
      message: error instanceof Error ? error.message : "Ingestion failed",
    };
  }

  try {
    results.priceRefresh = await refreshProductPrices({});
  } catch (error) {
    results.priceRefresh = {
      status: "error",
      message: error instanceof Error ? error.message : "Price refresh failed",
    };
  }

  try {
    results.contentGeneration = await generateReviewsForQueue({ limit: 5 });
  } catch (error) {
    results.contentGeneration = {
      status: "error",
      message:
        error instanceof Error ? error.message : "Content generation failed",
    };
  }

  return NextResponse.json({
    status: "ok",
    durationMs: Date.now() - startedAt,
    results,
    timestamp: new Date().toISOString(),
  });
}
