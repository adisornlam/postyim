import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { campaigns } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      slug: campaigns.slug,
      affiliateNetwork: campaigns.affiliateNetwork,
      status: campaigns.status,
      keywords: campaigns.keywords,
      config: campaigns.config,
      dailyProductLimit: campaigns.dailyProductLimit,
      priority: campaigns.priority,
      lastSyncedAt: campaigns.lastSyncedAt,
      createdAt: campaigns.createdAt,
    })
    .from(campaigns)
    .orderBy(desc(campaigns.priority), desc(campaigns.createdAt));

  return NextResponse.json({ campaigns: rows });
}
