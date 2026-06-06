import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { campaigns, products } from "@/db/schema";
import {
  badRequest,
  unauthorizedJobResponse,
  verifyJobAuth,
} from "@/lib/jobs/auth";
import {
  ingestActiveCampaigns,
  ingestCampaignProducts,
} from "@/lib/jobs/product-ingestion";

export async function POST(request: Request) {
  if (!(await verifyJobAuth(request))) {
    return unauthorizedJobResponse();
  }

  let body: { campaignId?: string; all?: boolean } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    if (body.all) {
      const results = await ingestActiveCampaigns();

      return NextResponse.json({
        status: "ok",
        count: results.length,
        results,
      });
    }

    if (body.campaignId) {
      const result = await ingestCampaignProducts(body.campaignId);

      return NextResponse.json({
        status: "ok",
        result,
      });
    }

    const [campaign] = await db
      .select({ id: campaigns.id, slug: campaigns.slug })
      .from(campaigns)
      .where(eq(campaigns.status, "active"))
      .orderBy(desc(campaigns.priority))
      .limit(1);

    if (!campaign) {
      return badRequest(
        "No active campaign found. Create a campaign or pass campaignId.",
      );
    }

    const result = await ingestCampaignProducts(campaign.id);

    return NextResponse.json({
      status: "ok",
      result,
      note: `Used first active campaign: ${campaign.slug}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function GET() {
  const [campaignCount, productCount] = await Promise.all([
    db.select({ id: campaigns.id }).from(campaigns),
    db.select({ id: products.id }).from(products),
  ]);

  return NextResponse.json({
    endpoint: "/api/jobs/ingest",
    methods: ["POST"],
    auth:
      process.env.NODE_ENV === "development"
        ? "Optional in development (Bearer CRON_SECRET in production)"
        : "Bearer CRON_SECRET required",
    body: {
      campaignId: "optional UUID for a specific campaign",
      all: "optional boolean to ingest all active campaigns",
    },
    stats: {
      campaigns: campaignCount.length,
      products: productCount.length,
    },
  });
}
