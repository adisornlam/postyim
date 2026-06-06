import { NextResponse } from "next/server";

import { requireAdminSessionUser } from "@/lib/admin/require-admin";
import { generateReviewForProduct } from "@/lib/jobs/content-generation";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSessionUser();

  if (auth.response) {
    return auth.response;
  }

  const { id } = await context.params;

  try {
    const result = await generateReviewForProduct(id);
    return NextResponse.json({ status: "ok", result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Review generation failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
