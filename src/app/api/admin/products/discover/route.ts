import { NextResponse } from "next/server";
import { z } from "zod";

import { discoverProductsForCampaign } from "@/lib/ai/discover-products";
import { requireAdminSession } from "@/lib/admin/require-admin";

const discoverRequestSchema = z.object({
  campaignId: z.string().uuid(),
  limit: z.number().int().min(1).max(10).optional(),
});

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = discoverRequestSchema.parse(await request.json());
    const result = await discoverProductsForCampaign(body);

    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product discovery failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
