import { count, eq } from "drizzle-orm";

import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { getSiteUrl } from "@/lib/env";
import { getRemoteSyncConfig } from "@/lib/sync/config";
import {
  unauthorizedSyncResponse,
  verifyRemoteSyncAuth,
} from "@/lib/sync/auth";

export async function GET(request: Request) {
  if (!verifyRemoteSyncAuth(request)) {
    return unauthorizedSyncResponse();
  }

  const [{ value: publishedReviewCount }] = await db
    .select({ value: count() })
    .from(reviews)
    .where(eq(reviews.status, "published"));

  const [{ value: productCount }] = await db
    .select({ value: count() })
    .from(products);

  const { isConfigured } = getRemoteSyncConfig();

  return Response.json({
    status: "ok",
    siteUrl: getSiteUrl(),
    syncEnabled: isConfigured,
    publishedReviewCount,
    productCount,
  });
}
