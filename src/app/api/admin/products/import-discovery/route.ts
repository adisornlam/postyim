import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { importDiscoveryCandidate } from "@/lib/products/discovery-import";

export async function POST(request: Request) {
  const auth = await requireSuperAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const result = await importDiscoveryCandidate(body);

    return NextResponse.json({ status: "ok", ...result }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import discovery candidate";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
