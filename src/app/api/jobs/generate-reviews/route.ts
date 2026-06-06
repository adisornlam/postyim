import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import {
  badRequest,
  unauthorizedJobResponse,
  verifyJobAuth,
} from "@/lib/jobs/auth";
import { generateReviewsForQueue } from "@/lib/jobs/content-generation";

export async function POST(request: Request) {
  if (!(await verifyJobAuth(request))) {
    return unauthorizedJobResponse();
  }

  let body: {
    campaignId?: string;
    productIds?: string[];
    limit?: number;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  if (body.limit !== undefined && (body.limit < 1 || body.limit > 20)) {
    return badRequest("limit must be between 1 and 20");
  }

  try {
    const result = await generateReviewsForQueue(body);

    return NextResponse.json({
      status: "ok",
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Content generation failed";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function GET() {
  const rows = await db
    .select({
      id: reviews.id,
      slug: reviews.slug,
      title: reviews.title,
      status: reviews.status,
      wordCount: reviews.wordCount,
      rating: reviews.rating,
      updatedAt: reviews.updatedAt,
    })
    .from(reviews)
    .orderBy(desc(reviews.updatedAt))
    .limit(20);

  return NextResponse.json({
    endpoint: "/api/jobs/generate-reviews",
    methods: ["POST"],
    body: {
      campaignId: "optional UUID",
      productIds: "optional string[]",
      limit: "optional number (default 5, max 20)",
    },
    recentReviews: rows,
  });
}
