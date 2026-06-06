import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  authors,
  campaigns,
  contentQualityScores,
  keywords,
  products,
  reviewVersions,
  reviews,
} from "@/db/schema";
import { generateProductReview } from "@/lib/ai";
import { ensureDisclosure, evaluateReviewQuality } from "@/lib/ai/quality-gate";
import { getSiteName, getSiteUrl } from "@/lib/env";
import { resolveTargetKeyword as resolveProductKeyword } from "@/lib/seo/resolve-target-keyword";
import {
  finishJobRun,
  logJobEvent,
  startJobRun,
  updateJobProgress,
} from "@/lib/jobs/logger";

export interface ContentGenerationResult {
  jobRunId: string;
  itemsProcessed: number;
  itemsFailed: number;
  results: Array<{
    productId: string;
    reviewId?: string;
    status: "pending_review" | "failed";
    mode: "live" | "mock";
    qualityPassed: boolean;
    overallScore?: number;
    error?: string;
  }>;
}

async function getExistingReviewContents(excludeReviewId?: string) {
  const rows = await db
    .select({ content: reviews.content })
    .from(reviews)
    .where(
      excludeReviewId
        ? sql`${reviews.id} <> ${excludeReviewId} AND ${reviews.status} IN ('pending_review', 'approved', 'scheduled', 'published')`
        : sql`${reviews.status} IN ('pending_review', 'approved', 'scheduled', 'published')`,
    );

  return rows.map((row) => row.content);
}

async function resolveTargetKeyword(input: {
  campaignKeywords: unknown;
  productTitle: string;
  externalId: string;
}) {
  const campaignKeywords = Array.isArray(input.campaignKeywords)
    ? input.campaignKeywords.filter(
        (keyword): keyword is string => typeof keyword === "string",
      )
    : [];

  const targetKeyword = resolveProductKeyword({
    productTitle: input.productTitle,
    externalId: input.externalId,
    campaignKeywords,
  });

  const [existing] = await db
    .select()
    .from(keywords)
    .where(eq(keywords.keyword, targetKeyword))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(keywords)
    .values({
      keyword: targetKeyword,
      intent: "commercial",
    })
    .returning();

  return created;
}

async function getNextVersionNumber(reviewId: string) {
  const [row] = await db
    .select({
      maxVersion: sql<number>`coalesce(max(${reviewVersions.versionNumber}), 0)`,
    })
    .from(reviewVersions)
    .where(eq(reviewVersions.reviewId, reviewId));

  return (row?.maxVersion ?? 0) + 1;
}

async function pickAuthor() {
  const activeAuthors = await db
    .select()
    .from(authors)
    .where(eq(authors.isActive, true))
    .orderBy(desc(authors.createdAt));

  if (activeAuthors.length === 0) {
    throw new Error("No active authors found. Run pnpm db:seed first.");
  }

  const index = Math.floor(Math.random() * activeAuthors.length);
  return activeAuthors[index];
}

export async function generateReviewForProduct(
  productId: string,
  options?: { force?: boolean; preservePublished?: boolean },
) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, product.campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error(`Campaign not found for product ${productId}`);
  }

  const manualKeyword =
    product.rawData &&
    typeof product.rawData === "object" &&
    "targetKeyword" in product.rawData &&
    typeof (product.rawData as { targetKeyword?: unknown }).targetKeyword ===
      "string"
      ? (product.rawData as { targetKeyword: string }).targetKeyword
      : undefined;

  const author = await pickAuthor();
  const keyword = manualKeyword
    ? await resolveTargetKeyword({
        campaignKeywords: [manualKeyword],
        productTitle: product.title,
        externalId: product.externalId,
      })
    : await resolveTargetKeyword({
        campaignKeywords: campaign.keywords,
        productTitle: product.title,
        externalId: product.externalId,
      });

  let [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .limit(1);

  const previousStatus = review?.status;

  if (!review) {
    [review] = await db
      .insert(reviews)
      .values({
        productId: product.id,
        authorId: author.id,
        keywordId: keyword.id,
        slug: `${product.slug}-review`.slice(0, 200),
        title: `${product.title} Review`,
        content: "Generating...",
        status: "generating",
      })
      .returning();
  } else if (
    ["published", "approved", "scheduled", "generating"].includes(review.status) &&
    !options?.force
  ) {
    throw new Error(
      `Review for product ${product.externalId} is in status "${review.status}" and cannot be regenerated automatically.`,
    );
  } else {
    [review] = await db
      .update(reviews)
      .set({
        status:
          options?.preservePublished && previousStatus
            ? previousStatus
            : "generating",
        authorId: author.id,
        keywordId: keyword.id,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, review.id))
      .returning();
  }

  const generation = await generateProductReview({
    product: {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      specs: (product.specs ?? {}) as Record<string, unknown>,
      affiliateLink: product.affiliateLink,
      externalId: product.externalId,
    },
    author: {
      name: author.name,
      title: author.title,
      bio: author.bio,
      credentials: author.credentials,
    },
    targetKeyword: keyword.keyword,
    templateId: "",
    siteName: getSiteName(),
  });

  const reviewContent = {
    ...generation.review,
    content: ensureDisclosure(generation.review.content),
  };

  const quality = evaluateReviewQuality({
    review: reviewContent,
    productSpecs: (product.specs ?? {}) as Record<string, unknown>,
    existingReviewContents: await getExistingReviewContents(review.id),
    productTitle: product.title,
    externalId: product.externalId,
  });

  const versionNumber = await getNextVersionNumber(review.id);
  const isInitialGeneration = versionNumber === 1;

  await db.insert(reviewVersions).values({
    reviewId: review.id,
    versionNumber,
    content: reviewContent.content,
    title: reviewContent.title,
    metaDescription: reviewContent.metaDescription,
    pros: reviewContent.pros,
    cons: reviewContent.cons,
    rating: reviewContent.rating.toFixed(1),
    changeReason: isInitialGeneration ? "initial_generation" : "regenerate",
  });

  const reviewSlug = `${product.slug}-review`.slice(0, 200);

  const nextStatus =
    options?.preservePublished && previousStatus
      ? previousStatus
      : quality.passed
        ? "pending_review"
        : "failed";

  const [savedReview] = await db
    .update(reviews)
    .set({
      slug: reviewSlug,
      title: reviewContent.title,
      metaDescription: reviewContent.metaDescription,
      content: reviewContent.content,
      pros: reviewContent.pros,
      cons: reviewContent.cons,
      rating: reviewContent.rating.toFixed(1),
      wordCount: quality.wordCount,
      status: nextStatus,
      canonicalUrl: `${getSiteUrl()}/reviews/${reviewSlug}`,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, review.id))
    .returning();

  await db.insert(contentQualityScores).values({
    reviewId: review.id,
    wordCountScore: quality.wordCountScore,
    uniquenessScore: quality.uniquenessScore,
    specAccuracyScore: quality.specAccuracyScore,
    seoScore: quality.seoScore,
    overallScore: quality.overallScore,
    checklist: quality.checklist,
    passed: quality.passed,
  });

  return {
    review: savedReview,
    generation,
    quality,
  };
}

export async function generateReviewsForQueue(input?: {
  campaignId?: string;
  productIds?: string[];
  limit?: number;
}): Promise<ContentGenerationResult> {
  const jobRun = await startJobRun({ jobType: "content_generation" });
  const startedAt = jobRun.startedAt ?? new Date();
  const limit = Math.min(input?.limit ?? 5, 20);

  let itemsProcessed = 0;
  let itemsFailed = 0;
  const results: ContentGenerationResult["results"] = [];

  await logJobEvent({
    jobRunId: jobRun.id,
    message: "Starting content generation queue",
    metadata: input,
  });

  try {
    const eligibleProducts = await db
      .select({
        product: products,
        reviewStatus: reviews.status,
      })
      .from(products)
      .leftJoin(reviews, eq(reviews.productId, products.id))
      .where(
        and(
          eq(products.isActive, true),
          eq(products.syncStatus, "synced"),
          ...(input?.campaignId
            ? [eq(products.campaignId, input.campaignId)]
            : []),
          ...(input?.productIds?.length
            ? [inArray(products.id, input.productIds)]
            : []),
          or(
            isNull(reviews.id),
            inArray(reviews.status, ["draft", "failed", "rejected"]),
          ),
        ),
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);

    if (eligibleProducts.length === 0) {
      await finishJobRun({
        jobRunId: jobRun.id,
        status: "completed",
        itemsProcessed: 0,
        itemsFailed: 0,
        startedAt,
        errorDetails: { message: "No eligible products in queue" },
      });

      return {
        jobRunId: jobRun.id,
        itemsProcessed: 0,
        itemsFailed: 0,
        results,
      };
    }

    for (const row of eligibleProducts) {
      try {
        const result = await generateReviewForProduct(row.product.id);
        itemsProcessed += 1;

        results.push({
          productId: row.product.id,
          reviewId: result.review.id,
          status: result.quality.passed ? "pending_review" : "failed",
          mode: result.generation.mode,
          qualityPassed: result.quality.passed,
          overallScore: result.quality.overallScore,
        });

        await logJobEvent({
          jobRunId: jobRun.id,
          message: `Generated review for ${row.product.externalId}`,
          metadata: {
            reviewId: result.review.id,
            mode: result.generation.mode,
            passed: result.quality.passed,
            overallScore: result.quality.overallScore,
          },
        });
      } catch (error) {
        itemsFailed += 1;
        const message =
          error instanceof Error ? error.message : "Generation failed";

        results.push({
          productId: row.product.id,
          status: "failed",
          mode: "mock",
          qualityPassed: false,
          error: message,
        });

        await logJobEvent({
          jobRunId: jobRun.id,
          level: "error",
          message: `Failed to generate review for ${row.product.externalId}`,
          metadata: { error: message },
        });
      }

      await updateJobProgress({
        jobRunId: jobRun.id,
        itemsProcessed,
        itemsFailed,
      });
    }

    await finishJobRun({
      jobRunId: jobRun.id,
      status: "completed",
      itemsProcessed,
      itemsFailed,
      startedAt,
      errorDetails: {
        results,
      },
    });

    return {
      jobRunId: jobRun.id,
      itemsProcessed,
      itemsFailed,
      results,
    };
  } catch (error) {
    await finishJobRun({
      jobRunId: jobRun.id,
      status: "failed",
      itemsProcessed,
      itemsFailed,
      startedAt,
      errorDetails: {
        message: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}
