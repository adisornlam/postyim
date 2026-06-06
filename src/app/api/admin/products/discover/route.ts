import { NextResponse } from "next/server";
import { z } from "zod";

import { discoverProductsForCampaign } from "@/lib/ai/discover-products";
import {
  createDiscoveryJobRun,
  startDiscoveryJobRun,
} from "@/lib/ai/discover-products-job";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { shouldUseGeminiMock } from "@/lib/settings/runtime-config";

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

    if (await shouldUseGeminiMock()) {
      const result = await discoverProductsForCampaign(body);
      return NextResponse.json({ status: "ok", ...result });
    }

    const jobRun = await createDiscoveryJobRun(body);
    startDiscoveryJobRun(jobRun.id);

    return NextResponse.json(
      {
        status: "accepted",
        jobRunId: jobRun.id,
        message:
          "Discovery started. Gemini search can take 1–3 minutes — keep this page open.",
      },
      { status: 202 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product discovery failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
