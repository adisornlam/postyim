import { and, desc, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  authors,
  campaigns,
  categories,
  contentQualityScores,
  keywords,
  mediaAssets,
  products,
  reviews,
} from "@/db/schema";

export async function getReviewBySlug(slug: string) {
  const [row] = await db
    .select({
      review: reviews,
      product: products,
      author: authors,
      keyword: keywords,
      category: categories,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(reviews.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function getPublishedReviewBySlug(slug: string) {
  const row = await getReviewBySlug(slug);

  if (!row || row.review.status !== "published") {
    return null;
  }

  return row;
}

export async function getPublishedReviewSlugs(limit = 100) {
  return db
    .select({ slug: reviews.slug, updatedAt: reviews.updatedAt })
    .from(reviews)
    .where(eq(reviews.status, "published"))
    .orderBy(desc(reviews.publishedAt))
    .limit(limit);
}

export async function getFeaturedPublishedReviews(limit = 6) {
  return db
    .select({
      review: reviews,
      product: products,
      author: authors,
      category: categories,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(eq(reviews.status, "published"))
    .orderBy(desc(reviews.publishedAt))
    .limit(limit);
}

export async function getCategoriesWithPublishedReviews() {
  return db
    .select({
      category: categories,
      reviewCount: sql<number>`count(distinct ${reviews.id})::int`,
    })
    .from(categories)
    .innerJoin(products, eq(products.categoryId, categories.id))
    .innerJoin(
      reviews,
      and(eq(reviews.productId, products.id), eq(reviews.status, "published")),
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`count(distinct ${reviews.id})`));
}

export async function getCategoryBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return row ?? null;
}

export async function getPublishedReviewsByCategorySlug(
  slug: string,
  limit = 24,
) {
  return db
    .select({
      review: reviews,
      product: products,
      author: authors,
      category: categories,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .where(and(eq(reviews.status, "published"), eq(categories.slug, slug)))
    .orderBy(desc(reviews.publishedAt))
    .limit(limit);
}

export async function getRelatedPublishedReviews(input: {
  excludeReviewId: string;
  categoryId?: string | null;
  limit?: number;
}) {
  const limit = input.limit ?? 3;

  const conditions = [
    eq(reviews.status, "published"),
    ne(reviews.id, input.excludeReviewId),
  ];

  if (input.categoryId) {
    conditions.push(eq(products.categoryId, input.categoryId));
  }

  return db
    .select({
      review: reviews,
      product: products,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(and(...conditions))
    .orderBy(desc(reviews.publishedAt))
    .limit(limit);
}

export async function listReviewsForAdmin(status?: string) {
  return db
    .select({
      review: reviews,
      product: products,
      author: authors,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .where(
      status
        ? eq(reviews.status, status as (typeof reviews.$inferSelect)["status"])
        : undefined,
    )
    .orderBy(desc(reviews.updatedAt));
}

export async function getReviewDetailForAdmin(reviewId: string) {
  const [row] = await db
    .select({
      review: reviews,
      product: products,
      author: authors,
      keyword: keywords,
      campaign: campaigns,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .leftJoin(campaigns, eq(campaigns.id, products.campaignId))
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [qualityScore] = await db
    .select()
    .from(contentQualityScores)
    .where(eq(contentQualityScores.reviewId, reviewId))
    .orderBy(desc(contentQualityScores.evaluatedAt))
    .limit(1);

  return { ...row, qualityScore };
}

export async function getAdminStats() {
  const [reviewCounts, productCount, campaignCount, pendingCount] =
    await Promise.all([
      db
        .select({
          status: reviews.status,
          count: sql<number>`count(*)::int`,
        })
        .from(reviews)
        .groupBy(reviews.status),
      db.select({ count: sql<number>`count(*)::int` }).from(products),
      db.select({ count: sql<number>`count(*)::int` }).from(campaigns),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(reviews)
        .where(eq(reviews.status, "pending_review")),
    ]);

  return {
    reviewsByStatus: reviewCounts,
    productCount: productCount[0]?.count ?? 0,
    campaignCount: campaignCount[0]?.count ?? 0,
    pendingReviewCount: pendingCount[0]?.count ?? 0,
  };
}

export async function listProductsForAdmin(limit = 50) {
  return db
    .select({
      product: products,
      campaign: campaigns,
      reviewStatus: reviews.status,
    })
    .from(products)
    .innerJoin(campaigns, eq(campaigns.id, products.campaignId))
    .leftJoin(reviews, eq(reviews.productId, products.id))
    .orderBy(desc(products.createdAt))
    .limit(limit);
}

export async function listCampaignsForAdmin() {
  return db
    .select({
      campaign: campaigns,
      category: categories,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(campaigns)
    .leftJoin(categories, eq(categories.id, campaigns.categoryId))
    .leftJoin(products, eq(products.campaignId, campaigns.id))
    .groupBy(campaigns.id, categories.id)
    .orderBy(desc(campaigns.priority), desc(campaigns.createdAt));
}

export async function getMediaAssetsForProduct(productId: string) {
  return db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, productId))
    .orderBy(mediaAssets.sortOrder);
}

export async function listCategoriesForAdmin() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getAuthorBySlug(slug: string) {
  const [author] = await db
    .select()
    .from(authors)
    .where(eq(authors.slug, slug))
    .limit(1);

  return author ?? null;
}

export async function getPublishedReviewsByAuthorSlug(
  slug: string,
  limit = 24,
) {
  return db
    .select({
      review: reviews,
      product: products,
      category: categories,
    })
    .from(reviews)
    .innerJoin(authors, eq(authors.id, reviews.authorId))
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(authors.slug, slug), eq(reviews.status, "published")))
    .orderBy(desc(reviews.publishedAt))
    .limit(limit);
}

export async function getCampaignDetailForAdmin(campaignId: string) {
  const [row] = await db
    .select({
      campaign: campaigns,
      category: categories,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(campaigns)
    .leftJoin(categories, eq(categories.id, campaigns.categoryId))
    .leftJoin(products, eq(products.campaignId, campaigns.id))
    .where(eq(campaigns.id, campaignId))
    .groupBy(campaigns.id, categories.id)
    .limit(1);

  return row ?? null;
}

export function isPriceStale(lastSyncedAt: Date | null | undefined): boolean {
  if (!lastSyncedAt) {
    return true;
  }

  const hoursSinceSync =
    (Date.now() - lastSyncedAt.getTime()) / (1000 * 60 * 60);

  return hoursSinceSync > 24;
}
