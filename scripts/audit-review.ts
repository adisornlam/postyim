import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { evaluateReviewById } from "@/lib/ai/review-qc";
import { db } from "@/db";
import { authors, keywords, mediaAssets, products, reviews } from "@/db/schema";

async function main() {
  const slug =
    process.argv[2] ?? "lumenarc-led-desk-lamp-b0mocklamp03-review";

  const [row] = await db
    .select({
      review: reviews,
      product: products,
      keyword: keywords,
      author: authors,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .where(eq(reviews.slug, slug))
    .limit(1);

  if (!row) {
    throw new Error(`Review not found: ${slug}`);
  }

  const media = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, row.product.id));

  const report = await evaluateReviewById(row.review.id);

  console.log(
    JSON.stringify(
      {
        slug,
        status: row.review.status,
        title: row.review.title,
        productTitle: row.product.title,
        author: row.author?.name,
        mediaAssets: media.length,
        qc: report,
      },
      null,
      2,
    ),
  );

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
