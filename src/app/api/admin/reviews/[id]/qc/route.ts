import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  evaluateReviewById,
  persistReviewQcReport,
} from "@/lib/ai/review-qc";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdminSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;

  try {
    const report = await evaluateReviewById(id);
    await persistReviewQcReport(id, report);

    return NextResponse.json({ status: "ok", report });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "QC evaluation failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
