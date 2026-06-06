import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import { assertReviewPublishable } from "@/lib/ai/review-qc";
import { approveReview, publishReview } from "@/lib/reviews/actions";
import { exportSyncBundleByReviewId } from "@/lib/sync/export-bundle";
import { pushBundleToRemote } from "@/lib/sync/client";

const REVIEW_SLUG =
  "lepro-led-desk-lamp-for-home-office-9-5w-metal-touch-control-5-color-modes-b08lmtq7zf-review";

async function main() {
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.slug, REVIEW_SLUG))
    .limit(1);

  if (!review) {
    throw new Error(`Review not found: ${REVIEW_SLUG}`);
  }

  const qc = await assertReviewPublishable(review.id);
  console.log("QC:", {
    passed: qc.passed,
    overallScore: qc.overallScore,
    failures: qc.failures,
  });

  await approveReview(review.id);
  await publishReview(review.id);

  const bundle = await exportSyncBundleByReviewId(review.id);
  if (bundle.review) {
    bundle.review.status = "published";
    bundle.review.publishedAt = new Date().toISOString();
    bundle.review.title =
      "Best LED Desk Lamp for Home Office: Lepro LED Desk Lamp Review";
  }

  const syncResult = await pushBundleToRemote(bundle);
  console.log(JSON.stringify({ status: "ok", syncResult }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
