import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  campaigns,
  categories,
  contentQualityScores,
  keywords,
  mediaAssets,
  products,
  reviews,
} from "@/db/schema";
import type { SyncBundle } from "@/lib/sync/types";
import { SYNC_BUNDLE_VERSION } from "@/lib/sync/types";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

async function loadReviewContext(reviewId: string) {
  const [row] = await db
    .select({
      review: reviews,
      product: products,
      campaign: campaigns,
      keyword: keywords,
      category: categories,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .innerJoin(campaigns, eq(campaigns.id, products.campaignId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!row) {
    throw new Error(`Review not found: ${reviewId}`);
  }

  const assets = await db
    .select({
      url: mediaAssets.url,
      altText: mediaAssets.altText,
      sortOrder: mediaAssets.sortOrder,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, row.product.id))
    .orderBy(mediaAssets.sortOrder);

  return { ...row, assets };
}

async function loadProductContext(productId: string) {
  const [row] = await db
    .select({
      product: products,
      campaign: campaigns,
      category: categories,
    })
    .from(products)
    .innerJoin(campaigns, eq(campaigns.id, products.campaignId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(products.id, productId))
    .limit(1);

  if (!row) {
    throw new Error(`Product not found: ${productId}`);
  }

  return row;
}

function buildBundleFromContext(input: {
  product: typeof products.$inferSelect;
  campaign: typeof campaigns.$inferSelect;
  category?: typeof categories.$inferSelect | null;
  review?: typeof reviews.$inferSelect;
  keyword?: typeof keywords.$inferSelect | null;
  qualityScore?: typeof contentQualityScores.$inferSelect | null;
  assets?: Array<{
    url: string;
    altText: string | null;
    sortOrder: number;
  }>;
}): SyncBundle {
  const { product, campaign, category, review, keyword, qualityScore, assets } =
    input;

  return {
    version: SYNC_BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    campaign: {
      slug: campaign.slug,
      name: campaign.name,
      keywords: asStringArray(campaign.keywords),
      affiliateNetwork: "amazon",
      status: campaign.status,
      config:
        campaign.config && typeof campaign.config === "object"
          ? (campaign.config as Record<string, unknown>)
          : {},
      dailyProductLimit: campaign.dailyProductLimit,
      categorySlug: category?.slug,
    },
    keyword: keyword
      ? {
          keyword: keyword.keyword,
          intent: keyword.intent,
        }
      : undefined,
    product: {
      campaignSlug: campaign.slug,
      externalId: product.externalId,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      affiliateLink: product.affiliateLink,
      imageUrl: product.imageUrl,
      specs:
        product.specs && typeof product.specs === "object"
          ? (product.specs as Record<string, unknown>)
          : {},
      rawData: product.rawData,
      categorySlug: category?.slug,
      mediaAssets: assets?.map((asset) => ({
        url: asset.url,
        altText: asset.altText,
        sortOrder: asset.sortOrder,
      })),
    },
    review: review
      ? {
          slug: review.slug,
          title: review.title,
          metaDescription: review.metaDescription,
          content: review.content,
          pros: asStringArray(review.pros),
          cons: asStringArray(review.cons),
          rating: review.rating,
          status: review.status,
          wordCount: review.wordCount,
          targetKeyword: keyword?.keyword,
          publishedAt: review.publishedAt?.toISOString() ?? null,
        }
      : undefined,
    qualityScore: qualityScore
      ? {
          wordCountScore: qualityScore.wordCountScore,
          uniquenessScore: qualityScore.uniquenessScore,
          specAccuracyScore: qualityScore.specAccuracyScore,
          seoScore: qualityScore.seoScore,
          overallScore: qualityScore.overallScore,
          checklist: qualityScore.checklist as Record<string, boolean>,
          passed: qualityScore.passed,
        }
      : undefined,
  };
}

export async function exportSyncBundleByReviewId(
  reviewId: string,
): Promise<SyncBundle> {
  const row = await loadReviewContext(reviewId);
  const [qualityScore] = await db
    .select()
    .from(contentQualityScores)
    .where(eq(contentQualityScores.reviewId, reviewId))
    .limit(1);

  return buildBundleFromContext({
    product: row.product,
    campaign: row.campaign,
    category: row.category,
    review: row.review,
    keyword: row.keyword,
    qualityScore,
    assets: row.assets,
  });
}

export async function exportSyncBundleByReviewSlug(
  reviewSlug: string,
): Promise<SyncBundle> {
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.slug, reviewSlug))
    .limit(1);

  if (!review) {
    throw new Error(`Review not found: ${reviewSlug}`);
  }

  return exportSyncBundleByReviewId(review.id);
}

export async function exportSyncBundleByProductId(
  productId: string,
): Promise<SyncBundle> {
  const row = await loadProductContext(productId);

  return buildBundleFromContext({
    product: row.product,
    campaign: row.campaign,
    category: row.category,
  });
}
