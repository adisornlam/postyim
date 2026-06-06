import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  authors,
  campaigns,
  categories,
  contentQualityScores,
  keywords,
  products,
  reviews,
} from "@/db/schema";
import { getSiteUrl } from "@/lib/env";
import {
  buildDuplicateHash,
  buildProductSlug,
} from "@/lib/products/slug";
import { syncProductMediaAssets } from "@/lib/products/media-sync";
import type { SyncBundle, SyncPushResult } from "@/lib/sync/types";
import { SYNC_BUNDLE_VERSION } from "@/lib/sync/types";

async function resolveCategoryId(categorySlug?: string) {
  if (!categorySlug) {
    return null;
  }

  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  return category?.id ?? null;
}

async function upsertCampaignFromBundle(
  bundle: SyncBundle,
): Promise<{ id: string; created: boolean }> {
  const payload = bundle.campaign;

  if (!payload) {
    throw new Error("Sync bundle is missing campaign metadata.");
  }

  const categoryId = await resolveCategoryId(payload.categorySlug);
  const [existing] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(eq(campaigns.slug, payload.slug))
    .limit(1);

  if (existing) {
    await db
      .update(campaigns)
      .set({
        name: payload.name,
        keywords: payload.keywords,
        config: payload.config ?? {},
        dailyProductLimit: payload.dailyProductLimit ?? 10,
        status: payload.status,
        categoryId,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, existing.id));

    return { id: existing.id, created: false };
  }

  const [created] = await db
    .insert(campaigns)
    .values({
      slug: payload.slug,
      name: payload.name,
      keywords: payload.keywords,
      config: payload.config ?? {},
      dailyProductLimit: payload.dailyProductLimit ?? 10,
      status: payload.status,
      affiliateNetwork: "amazon",
      categoryId,
    })
    .returning({ id: campaigns.id });

  return { id: created.id, created: true };
}

async function upsertKeywordFromBundle(
  bundle: SyncBundle,
): Promise<{ id: string | null; created: boolean }> {
  const payload = bundle.keyword ?? bundle.review?.targetKeyword
    ? {
        keyword:
          bundle.keyword?.keyword ??
          bundle.review?.targetKeyword ??
          "",
        intent: bundle.keyword?.intent ?? ("commercial" as const),
      }
    : null;

  if (!payload?.keyword) {
    return { id: null, created: false };
  }

  const [existing] = await db
    .select({ id: keywords.id })
    .from(keywords)
    .where(eq(keywords.keyword, payload.keyword))
    .limit(1);

  if (existing) {
    return { id: existing.id, created: false };
  }

  const [created] = await db
    .insert(keywords)
    .values({
      keyword: payload.keyword,
      intent: payload.intent,
    })
    .returning({ id: keywords.id });

  return { id: created.id, created: true };
}

async function resolveAuthorId(authorSlug?: string) {
  if (authorSlug) {
    const [author] = await db
      .select({ id: authors.id })
      .from(authors)
      .where(eq(authors.slug, authorSlug))
      .limit(1);

    if (author) {
      return author.id;
    }
  }

  const [fallbackAuthor] = await db
    .select({ id: authors.id })
    .from(authors)
    .limit(1);

  return fallbackAuthor?.id ?? null;
}

export async function importSyncBundle(bundle: SyncBundle): Promise<SyncPushResult> {
  if (bundle.version !== SYNC_BUNDLE_VERSION) {
    throw new Error(`Unsupported sync bundle version: ${bundle.version}`);
  }

  const campaign = await upsertCampaignFromBundle(bundle);
  const keyword = await upsertKeywordFromBundle(bundle);
  const categoryId = await resolveCategoryId(bundle.product.categorySlug);
  const duplicateHash = buildDuplicateHash("amazon", bundle.product.externalId);
  const slug = buildProductSlug(
    bundle.product.title,
    bundle.product.externalId,
  );
  const now = new Date();

  const [existingProduct] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.duplicateHash, duplicateHash))
    .limit(1);

  let productId: string;
  let productCreated = false;

  if (existingProduct) {
    productId = existingProduct.id;

    await db
      .update(products)
      .set({
        campaignId: campaign.id,
        categoryId,
        title: bundle.product.title,
        description: bundle.product.description,
        price: bundle.product.price,
        currency: bundle.product.currency,
        affiliateLink: bundle.product.affiliateLink,
        imageUrl: bundle.product.imageUrl,
        specs: bundle.product.specs ?? {},
        rawData: bundle.product.rawData ?? { source: "remote-sync" },
        syncStatus: "synced",
        isActive: true,
        lastSyncedAt: now,
        updatedAt: now,
      })
      .where(eq(products.id, productId));
  } else {
    const [createdProduct] = await db
      .insert(products)
      .values({
        campaignId: campaign.id,
        categoryId,
        affiliateNetwork: "amazon",
        externalId: bundle.product.externalId,
        slug,
        title: bundle.product.title,
        description: bundle.product.description,
        price: bundle.product.price,
        currency: bundle.product.currency,
        affiliateLink: bundle.product.affiliateLink,
        imageUrl: bundle.product.imageUrl,
        specs: bundle.product.specs ?? {},
        rawData: bundle.product.rawData ?? { source: "remote-sync" },
        duplicateHash,
        syncStatus: "synced",
        isActive: true,
        lastSyncedAt: now,
      })
      .returning({ id: products.id });

    productId = createdProduct.id;
    productCreated = true;
  }

  await syncProductMediaAssets({
    productId,
    imageUrl: bundle.product.imageUrl,
    title: bundle.product.title,
  });

  if (!bundle.review) {
    return {
      productId,
      productSlug: slug,
      created: {
        campaign: campaign.created,
        keyword: keyword.created,
        product: productCreated,
        review: false,
      },
    };
  }

  const authorId = await resolveAuthorId(bundle.review.authorSlug);
  const siteUrl = getSiteUrl();
  const publishedAt =
    bundle.review.status === "published"
      ? bundle.review.publishedAt
        ? new Date(bundle.review.publishedAt)
        : now
      : null;
  const canonicalUrl =
    bundle.review.status === "published"
      ? `${siteUrl}/reviews/${bundle.review.slug}`
      : null;

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.slug, bundle.review.slug))
    .limit(1);

  let reviewId: string;
  let reviewCreated = false;

  if (existingReview) {
    reviewId = existingReview.id;

    await db
      .update(reviews)
      .set({
        productId,
        authorId,
        keywordId: keyword.id,
        title: bundle.review.title,
        metaDescription: bundle.review.metaDescription,
        content: bundle.review.content,
        pros: bundle.review.pros,
        cons: bundle.review.cons,
        rating: bundle.review.rating,
        status: bundle.review.status as typeof reviews.$inferInsert.status,
        wordCount: bundle.review.wordCount,
        publishedAt,
        canonicalUrl,
        updatedAt: now,
      })
      .where(eq(reviews.id, reviewId));
  } else {
    const [createdReview] = await db
      .insert(reviews)
      .values({
        productId,
        authorId,
        keywordId: keyword.id,
        slug: bundle.review.slug,
        title: bundle.review.title,
        metaDescription: bundle.review.metaDescription,
        content: bundle.review.content,
        pros: bundle.review.pros,
        cons: bundle.review.cons,
        rating: bundle.review.rating,
        status: bundle.review.status as typeof reviews.$inferInsert.status,
        wordCount: bundle.review.wordCount,
        publishedAt,
        canonicalUrl,
      })
      .returning({ id: reviews.id });

    reviewId = createdReview.id;
    reviewCreated = true;
  }

  if (bundle.qualityScore) {
    await db.insert(contentQualityScores).values({
      reviewId,
      wordCountScore: bundle.qualityScore.wordCountScore,
      uniquenessScore: bundle.qualityScore.uniquenessScore,
      specAccuracyScore: bundle.qualityScore.specAccuracyScore,
      seoScore: bundle.qualityScore.seoScore,
      overallScore: bundle.qualityScore.overallScore,
      checklist: bundle.qualityScore.checklist,
      passed: bundle.qualityScore.passed,
    });
  }

  return {
    productId,
    reviewId,
    productSlug: slug,
    reviewSlug: bundle.review.slug,
    reviewStatus: bundle.review.status,
    created: {
      campaign: campaign.created,
      keyword: keyword.created,
      product: productCreated,
      review: reviewCreated,
    },
  };
}
