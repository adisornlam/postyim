import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  authors,
  campaigns,
  contentQualityScores,
  keywords,
  mediaAssets,
  products,
  reviewVersions,
  reviews,
} from "@/db/schema";
import { generateProductReview } from "@/lib/ai";
import { ensureDisclosure, evaluateReviewQuality, countWords } from "@/lib/ai/quality-gate";
import { normalizeReviewTitle, QUALITY_THRESHOLDS } from "@/lib/ai/constants";
import { getSiteName, getSiteUrl } from "@/lib/env";
import { enrichReviewContent } from "@/lib/reviews/enrich-review-content";
import { getSectionProductImages } from "@/lib/reviews/review-images";
import { evaluatePublishReadiness } from "@/lib/reviews/publish-readiness";
import { extractProductResearch } from "@/lib/products/research-types";
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
  const preserveContentSnapshot =
    options?.preservePublished && review && previousStatus === "published"
      ? {
          slug: review.slug,
          title: review.title,
          metaDescription: review.metaDescription,
          content: review.content,
          pros: review.pros,
          cons: review.cons,
          rating: review.rating,
          wordCount: review.wordCount,
        }
      : null;

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

  const factSheet = extractProductResearch(product.rawData) ?? undefined;

  const productMedia = await db
    .select({
      url: mediaAssets.url,
      altText: mediaAssets.altText,
      sortOrder: mediaAssets.sortOrder,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, product.id))
    .orderBy(mediaAssets.sortOrder);

  const generationInput = {
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
    factSheet,
  };

  const sectionImages = getSectionProductImages({
    productTitle: product.title,
    productImageUrl: product.imageUrl,
    mediaAssets: productMedia,
    researchImages: factSheet?.productImages,
  });

  const MAX_GENERATION_ATTEMPTS = 2;
  let generation = await generateProductReview(generationInput);
  let reviewContent = {
    ...generation.review,
    title: normalizeReviewTitle(generation.review.title, keyword.keyword),
    content: ensureDisclosure(
      enrichReviewContent(generation.review.content, sectionImages),
    ),
  };
  let quality = evaluateReviewQuality({
    review: reviewContent,
    productSpecs: (product.specs ?? {}) as Record<string, unknown>,
    existingReviewContents: await getExistingReviewContents(review.id),
    productTitle: product.title,
    externalId: product.externalId,
  });

  for (let attempt = 2; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const needsRetry =
      !quality.checklist.wordCountMin1500 ||
      !quality.checklist.seoKeywordInContent;

    if (!needsRetry) {
      break;
    }

    const wordCount = countWords(reviewContent.content);
    generation = await generateProductReview({
      ...generationInput,
      retryFeedback: [
        `The previous draft was ${wordCount} words; write at least ${QUALITY_THRESHOLDS.minWordCount} words.`,
        `Include the exact phrase "${keyword.keyword}" at least once in the body.`,
        "Expand each H2 section with concrete detail from the verified fact sheet.",
      ].join(" "),
    });

    reviewContent = {
      ...generation.review,
      title: normalizeReviewTitle(generation.review.title, keyword.keyword),
      content: ensureDisclosure(
        enrichReviewContent(generation.review.content, sectionImages),
      ),
    };

    quality = evaluateReviewQuality({
      review: reviewContent,
      productSpecs: (product.specs ?? {}) as Record<string, unknown>,
      existingReviewContents: await getExistingReviewContents(review.id),
      productTitle: product.title,
      externalId: product.externalId,
    });
  }

  const publishReadiness = evaluatePublishReadiness({
    content: reviewContent.content,
    product: {
      title: product.title,
      externalId: product.externalId,
      imageUrl: product.imageUrl,
    },
    mediaAssets: productMedia,
  });

  const qualityPassed =
    quality.passed &&
    Object.values(publishReadiness.checklist).every(Boolean);

  if (preserveContentSnapshot && !qualityPassed) {
    const [restoredReview] = await db
      .update(reviews)
      .set({
        ...preserveContentSnapshot,
        status: previousStatus,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, review.id))
      .returning();

    return {
      review: restoredReview,
      generation,
      quality,
      qualityPassed: false,
      publishReadiness,
    };
  }

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
      : qualityPassed
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
    checklist: {
      ...quality.checklist,
      ...publishReadiness.checklist,
    },
    passed: qualityPassed,
  });

  return {
    review: savedReview,
    generation,
    quality,
    qualityPassed,
    publishReadiness,
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
          status: result.qualityPassed ? "pending_review" : "failed",
          mode: result.generation.mode,
          qualityPassed: result.qualityPassed,
          overallScore: result.quality.overallScore,
        });

        await logJobEvent({
          jobRunId: jobRun.id,
          message: `Generated review for ${row.product.externalId}`,
          metadata: {
            reviewId: result.review.id,
            mode: result.generation.mode,
            passed: result.qualityPassed,
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
