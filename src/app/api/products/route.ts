import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { products } from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);

  const rows = await db
    .select({
      id: products.id,
      campaignId: products.campaignId,
      externalId: products.externalId,
      slug: products.slug,
      title: products.title,
      price: products.price,
      currency: products.currency,
      affiliateLink: products.affiliateLink,
      imageUrl: products.imageUrl,
      syncStatus: products.syncStatus,
      lastSyncedAt: products.lastSyncedAt,
      createdAt: products.createdAt,
    })
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(Number.isFinite(limit) ? limit : 20);

  return NextResponse.json({ products: rows, count: rows.length });
}
