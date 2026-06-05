import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { createCampaign } from "@/lib/campaigns/actions";
import { createCampaignSchema } from "@/lib/campaigns/validation";
import { listCampaignsForAdmin } from "@/lib/reviews/queries";

export async function GET() {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const campaigns = await listCampaignsForAdmin();
  return NextResponse.json({ campaigns });
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = createCampaignSchema.parse(await request.json());
    const campaign = await createCampaign(body);

    return NextResponse.json({ status: "ok", campaign }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create campaign";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
