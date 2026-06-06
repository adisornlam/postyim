import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { evaluateReviewById } from "@/lib/ai/review-qc";
import { ensureDisclosure } from "@/lib/ai/quality-gate";
import { db } from "@/db";
import { mediaAssets, products, reviews } from "@/db/schema";
import { enrichReviewContent } from "@/lib/reviews/enrich-review-content";
import { getEditorialImagesForProduct } from "@/lib/reviews/editorial-images";
import { exportSyncBundleByReviewId } from "@/lib/sync/export-bundle";
import { pushBundleToRemote } from "@/lib/sync/client";

const REVIEW_SLUG =
  process.argv[2] ??
  "lepro-led-desk-lamp-for-home-office-9-5w-metal-touch-control-5-color-modes-b08lmtq7zf-review";

async function main() {
  const [row] = await db
    .select({
      review: reviews,
      product: products,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.slug, REVIEW_SLUG))
    .limit(1);

  if (!row) {
    throw new Error(`Review not found: ${REVIEW_SLUG}`);
  }

  const editorialImages = getEditorialImagesForProduct({
    externalId: row.product.externalId,
    title: row.product.title,
  });

  const enrichedContent = ensureDisclosure(
    enrichReviewContent(row.review.content, editorialImages),
  );

  await db
    .update(reviews)
    .set({
      content: enrichedContent,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, row.review.id));

  await db
    .update(products)
    .set({
      imageUrl: editorialImages[0]?.url ?? row.product.imageUrl,
      updatedAt: new Date(),
    })
    .where(eq(products.id, row.product.id));

  await db.delete(mediaAssets).where(eq(mediaAssets.productId, row.product.id));

  await db.insert(mediaAssets).values(
    editorialImages.slice(0, 3).map((image, index) => ({
      productId: row.product.id,
      type: "image" as const,
      url: image.url,
      altText: image.caption ?? image.alt,
      sortOrder: index,
    })),
  );

  const qc = await evaluateReviewById(row.review.id);
  console.log("QC after fix:", {
    passed: qc.passed,
    failures: qc.failures,
    checklist: qc.checklist,
  });

  if (!qc.passed) {
    process.exit(1);
  }

  const bundle = await exportSyncBundleByReviewId(row.review.id);
  const syncResult = await pushBundleToRemote(bundle);
  console.log(JSON.stringify({ status: "ok", syncResult }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
