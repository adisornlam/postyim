import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import { evaluateReviewById } from "@/lib/ai/review-qc";
import { generateReviewForProduct } from "@/lib/jobs/content-generation";
import { createManualAmazonProduct } from "@/lib/products/manual-create";
import {
  approveReview,
  publishReview,
} from "@/lib/reviews/actions";
import {
  exportSyncBundleByReviewId,
} from "@/lib/sync/export-bundle";
import { pushBundleToRemote } from "@/lib/sync/client";

const CAMPAIGN_ID = "a5a262f1-3c29-49ff-a11a-fe7cce0a70c6";

async function main() {
  console.log("1/4 Creating manual Amazon product...");
  const { product } = await createManualAmazonProduct({
    campaignId: CAMPAIGN_ID,
    externalId: "B08LMTQ7ZF",
    title:
      "Lepro LED Desk Lamp for Home Office, 9.5W Metal Touch Control, 5 Color Modes",
    description:
      "Compact metal desk lamp with 5 color temperatures, 5 brightness levels, and eye-care diffused lighting for home office and reading.",
    price: 22.99,
    targetKeyword: "best LED desk lamp for home office",
    imageUrl:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    specs: {
      brand: "Lepro",
      wattage: "9.5W",
      brightness: "750LM",
      features: [
        "5 color modes",
        "5 brightness levels",
        "Touch control",
        "Eye-caring diffused light",
      ],
    },
  });

  console.log(`   Product: ${product.title} (${product.externalId})`);
  console.log(`   Link: ${product.affiliateLink}`);

  console.log("\n2/4 Generating review with Gemini...");
  const result = await generateReviewForProduct(product.id, { force: true });
  const review = result.review;

  console.log(`   Review: ${review.slug} (${review.status})`);
  console.log(`   Words: ${review.wordCount ?? 0}, score: ${result.quality.overallScore}`);

  console.log("\n3/4 Running QC...");
  const qc = await evaluateReviewById(review.id);
  console.log(`   QC passed: ${qc.passed} (${qc.overallScore}/100)`);

  if (!qc.passed) {
    console.log("   Failures:", qc.failures.join(" | "));
    process.exit(1);
  }

  console.log("\n4/4 Approving, publishing, and syncing to postyim.com...");
  await approveReview(review.id);
  await publishReview(review.id);

  const bundle = await exportSyncBundleByReviewId(review.id);
  if (bundle.review) {
    bundle.review.status = "published";
    bundle.review.publishedAt = new Date().toISOString();
  }

  const syncResult = await pushBundleToRemote(bundle);
  console.log(JSON.stringify({ status: "ok", syncResult }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
