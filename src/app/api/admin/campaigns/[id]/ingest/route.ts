import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getCampaignById } from "@/lib/campaigns/actions";
import { ingestCampaignProducts } from "@/lib/jobs/product-ingestion";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const campaign = await getCampaignById(id);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  try {
    const result = await ingestCampaignProducts(id);
    return NextResponse.json({ status: "ok", result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ingestion failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
