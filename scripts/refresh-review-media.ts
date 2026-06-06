import { config } from "dotenv";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";

import { generateMockReview } from "@/lib/ai/mock/generate-review";
import { ensureDisclosure } from "@/lib/ai/quality-gate";
import { resolveTargetKeyword } from "@/lib/seo/resolve-target-keyword";
import { getEditorialImagesForProduct } from "@/lib/reviews/editorial-images";
import { db } from "@/db";
import { keywords, mediaAssets, products, reviews } from "@/db/schema";

async function main() {
  const slug = "lumenarc-led-desk-lamp-b0mocklamp03-review";

  const [row] = await db
    .select({
      review: reviews,
      product: products,
      keyword: keywords,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .where(eq(reviews.slug, slug))
    .limit(1);

  if (!row) {
    throw new Error(`Review not found: ${slug}`);
  }

  const images = getEditorialImagesForProduct({
    externalId: row.product.externalId,
    title: row.product.title,
  });

  await db
    .update(products)
    .set({ imageUrl: images[0]?.url ?? row.product.imageUrl })
    .where(eq(products.id, row.product.id));

  await db.delete(mediaAssets).where(eq(mediaAssets.productId, row.product.id));

  await db.insert(mediaAssets).values(
    images.map((image, index) => ({
      productId: row.product.id,
      type: "image" as const,
      url: image.url,
      altText: image.caption ?? image.alt,
      sortOrder: index,
    })),
  );

  const targetKeyword = resolveTargetKeyword({
    externalId: row.product.externalId,
    productTitle: row.product.title,
    campaignKeywords: row.keyword?.keyword
      ? [row.keyword.keyword]
      : ["desk lamp", "standing desk", "ergonomic office chair"],
  });

  const generated = generateMockReview({
    product: {
      id: row.product.id,
      title: row.product.title,
      externalId: row.product.externalId,
      description: row.product.description ?? undefined,
      price: row.product.price ?? undefined,
      currency: row.product.currency,
      affiliateLink: row.product.affiliateLink,
      specs: (row.product.specs ?? {}) as Record<string, unknown>,
    },
    targetKeyword,
    author: {
      name: "Sarah Chen",
      title: "Ergonomics Specialist",
      bio: "Sarah has spent 12 years optimizing home workspaces for remote professionals.",
      credentials: [],
    },
    siteName: "Postyim",
    templateId: "hands-on-first",
  });

  await db
    .update(reviews)
    .set({
      title: generated.review.title,
      content: ensureDisclosure(generated.review.content),
      pros: generated.review.pros,
      cons: generated.review.cons,
      rating: generated.review.rating.toString(),
      metaDescription: generated.review.metaDescription,
      wordCount: generated.review.content.split(/\s+/).filter(Boolean).length,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, row.review.id));

  console.log(`Refreshed review content and media for ${slug}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
