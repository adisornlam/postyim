import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminSessionUser } from "@/lib/admin/require-admin";
import { exportSyncBundleByReviewId } from "@/lib/sync/export-bundle";
import { pushBundleToRemote } from "@/lib/sync/client";
import { getRemoteSyncConfig } from "@/lib/sync/config";

const bodySchema = z.object({
  reviewId: z.string().uuid(),
  publish: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireAdminSessionUser();

  if (auth.response) {
    return auth.response;
  }

  if (!getRemoteSyncConfig().isConfigured) {
    return NextResponse.json(
      { error: "Remote sync is not configured on this server." },
      { status: 400 },
    );
  }

  try {
    const body = bodySchema.parse(await request.json());
    const bundle = await exportSyncBundleByReviewId(body.reviewId);

    if (body.publish && bundle.review) {
      bundle.review.status = "published";
      bundle.review.publishedAt = new Date().toISOString();
    }

    const result = await pushBundleToRemote(bundle);
    return NextResponse.json({ status: "ok", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
