import { NextResponse } from "next/server";

import {
  unauthorizedJobResponse,
  verifyJobAuth,
} from "@/lib/jobs/auth";
import { refreshProductPrices } from "@/lib/jobs/price-refresh";

export async function POST(request: Request) {
  if (!(await verifyJobAuth(request))) {
    return unauthorizedJobResponse();
  }

  let body: { campaignId?: string; productIds?: string[] } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const result = await refreshProductPrices(body);

    return NextResponse.json({
      status: "ok",
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Price refresh failed";

    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/jobs/refresh-prices",
    methods: ["POST"],
    body: {
      campaignId: "optional UUID",
      productIds: "optional string[]",
    },
  });
}
