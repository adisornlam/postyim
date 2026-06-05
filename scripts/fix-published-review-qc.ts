import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { evaluateReviewById, persistReviewQcReport } from "@/lib/ai/review-qc";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { generateReviewForProduct } from "@/lib/jobs/content-generation";
import { publishReview } from "@/lib/reviews/actions";

async function main() {
  const slug =
    process.argv[2] ?? "lumenarc-led-desk-lamp-b0mocklamp03-review";

  const [row] = await db
    .select({
      review: reviews,
      product: products,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.slug, slug))
    .limit(1);

  if (!row) {
    throw new Error(`Review not found: ${slug}`);
  }

  console.log(`Regenerating QC-compliant content for ${slug}...`);

  await generateReviewForProduct(row.product.id, {
    force: true,
    preservePublished: row.review.status === "published",
  });

  let report = await evaluateReviewById(row.review.id);
  await persistReviewQcReport(row.review.id, report);

  if (report.passed && row.review.status !== "published") {
    await publishReview(row.review.id);
    report = await evaluateReviewById(row.review.id);
  }

  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
