import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  deleteCampaign,
  getCampaignById,
  updateCampaign,
} from "@/lib/campaigns/actions";
import { updateCampaignSchema } from "@/lib/campaigns/validation";

export async function GET(
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

  return NextResponse.json({ campaign });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  try {
    const body = updateCampaignSchema.parse(await request.json());
    const campaign = await updateCampaign(id, body);

    return NextResponse.json({ status: "ok", campaign });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update campaign";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  try {
    await deleteCampaign(id);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete campaign";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
