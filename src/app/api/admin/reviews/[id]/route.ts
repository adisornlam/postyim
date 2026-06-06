import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/session";
import {
  approveAndPublishReview,
  approveReview,
  publishReview,
  regenerateReviewById,
  rejectReview,
} from "@/lib/reviews/actions";

async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) {
    return unauthorized;
  }

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };

  try {
    switch (body.action) {
      case "approve": {
        const review = await approveReview(id);
        return NextResponse.json({ status: "ok", review });
      }
      case "publish": {
        const review = await publishReview(id);
        return NextResponse.json({ status: "ok", review });
      }
      case "approve_and_publish": {
        const review = await approveAndPublishReview(id);
        return NextResponse.json({ status: "ok", review });
      }
      case "reject": {
        const review = await rejectReview(id);
        return NextResponse.json({ status: "ok", review });
      }
      case "regenerate": {
        const detail = await regenerateReviewById(id);
        return NextResponse.json({ status: "ok", result: detail });
      }
      default:
        return NextResponse.json(
          { error: "Invalid action. Use approve, publish, approve_and_publish, reject, or regenerate." },
          { status: 400 },
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
