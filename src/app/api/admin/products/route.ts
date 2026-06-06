import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { createManualAmazonProduct } from "@/lib/products/manual-create";

export async function POST(request: Request) {
  const auth = await requireSuperAdminSession();

  if (auth.response) {
    return auth.response;
  }

  try {
    const body = await request.json();
    const result = await createManualAmazonProduct(body);
    return NextResponse.json({ status: "ok", ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
