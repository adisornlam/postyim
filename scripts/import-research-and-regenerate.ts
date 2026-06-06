import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { assertReviewPublishable } from "@/lib/ai/review-qc";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { importProductResearch } from "@/lib/products/import-research";
import { generateReviewForProduct } from "@/lib/jobs/content-generation";
import { exportSyncBundleByReviewId } from "@/lib/sync/export-bundle";
import { pushBundleToRemote } from "@/lib/sync/client";

const researchPath =
  process.argv[2] ?? resolve(process.cwd(), "research/B08LMTQ7ZF.json");
const skipSync = process.argv.includes("--no-sync");
const importOnly = process.argv.includes("--import-only");

async function main() {
  const raw = readFileSync(researchPath, "utf8");
  const payload = JSON.parse(raw) as unknown;

  console.log(`1/4 Importing research from ${researchPath}...`);
  const imported = await importProductResearch(payload);
  console.log(`   Product: ${imported.product.externalId} — ${imported.product.title}`);

  if (importOnly) {
    console.log("\n2/4 Skipped regenerate (--import-only).");
  } else {
    console.log("\n2/4 Regenerating review from verified fact sheet...");
    const result = await generateReviewForProduct(imported.product.id, {
      force: true,
      preservePublished: true,
    });
    console.log(
      `   Review: ${result.review.slug} (${result.review.status}) — QC passed: ${result.qualityPassed}`,
    );

    console.log("\n3/4 Running publish QC...");
    const qc = await assertReviewPublishable(result.review.id);
    console.log(`   QC: ${qc.passed ? "passed" : "failed"} (${qc.overallScore}/100)`);
    if (!qc.passed) {
      console.log("   Failures:", qc.failures.join(" | "));
      process.exit(1);
    }

    if (skipSync) {
      console.log("\n4/4 Skipped sync (--no-sync).");
      return;
    }

    console.log("\n4/4 Syncing to production...");
    const [publishedReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, result.review.id))
      .limit(1);

    const bundle = await exportSyncBundleByReviewId(result.review.id);
    if (bundle.review && publishedReview?.status === "published") {
      bundle.review.status = "published";
      bundle.review.publishedAt =
        publishedReview.publishedAt?.toISOString() ?? new Date().toISOString();
    }

    const syncResult = await pushBundleToRemote(bundle);
    console.log(JSON.stringify({ status: "ok", syncResult }, null, 2));
    return;
  }

  if (skipSync) {
    console.log("\nSkipped sync (--no-sync).");
    return;
  }

  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, imported.product.id))
    .limit(1);

  if (!review) {
    throw new Error("No review found for imported product.");
  }

  console.log("\n3/4 Syncing product media to production...");
  const bundle = await exportSyncBundleByReviewId(review.id);
  const syncResult = await pushBundleToRemote(bundle);
  console.log(JSON.stringify({ status: "ok", syncResult }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
