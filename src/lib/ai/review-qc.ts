import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  contentQualityScores,
  keywords,
  mediaAssets,
  products,
  reviews,
} from "@/db/schema";
import { evaluateReviewQuality } from "@/lib/ai/quality-gate";
import { QUALITY_THRESHOLDS } from "@/lib/ai/constants";
import { evaluatePublishReadiness } from "@/lib/reviews/publish-readiness";
import { scoreKeywordRelevance } from "@/lib/seo/resolve-target-keyword";

export interface ReviewQcReport {
  passed: boolean;
  overallScore: number;
  editorialScore: number;
  seoScore: number;
  wordCount: number;
  targetKeyword: string;
  checklist: Record<string, boolean>;
  failures: string[];
  warnings: string[];
}

function buildFailures(
  checklist: Record<string, boolean>,
  keywordReason?: string,
): string[] {
  const failures: string[] = [];

  if (!checklist.wordCountMin1500) {
    failures.push("Word count is below 1,500.");
  }
  if (!checklist.hasProsCons) {
    failures.push("Review needs at least 3 pros and 3 cons.");
  }
  if (!checklist.hasDisclosure) {
    failures.push("Affiliate disclosure is missing from review content.");
  }
  if (!checklist.noProhibitedPhrases) {
    failures.push("Review contains prohibited AI phrases.");
  }
  if (!checklist.metaDescriptionLength) {
    failures.push("Meta description must be 120–160 characters.");
  }
  if (!checklist.ratingWithJustification) {
    failures.push("Rating must include a valid score and justification.");
  }
  if (!checklist.uniquenessThreshold) {
    failures.push("Uniqueness score is below 85%.");
  }
  if (!checklist.specAccuracyPresent) {
    failures.push("Key product specs are missing from the review body.");
  }
  if (!checklist.keywordRelevance) {
    failures.push(keywordReason ?? "Target keyword does not match product intent.");
  }
  if (!checklist.seoKeywordInTitle) {
    failures.push("Target keyword is missing from the review title.");
  }
  if (!checklist.seoKeywordInContent) {
    failures.push("Target keyword is missing from the review body.");
  }
  if (!checklist.noHtmlHeadings) {
    failures.push("Review content contains raw HTML headings — use markdown ## headings only.");
  }
  if (!checklist.hasMarkdownHeadings) {
    failures.push(
      `Review needs at least ${QUALITY_THRESHOLDS.minMarkdownHeadings} markdown H2/H3 headings.`,
    );
  }
  if (!checklist.bodyImagesValid) {
    failures.push("One or more inline images use invalid or placeholder URLs.");
  }
  if (!checklist.minBodyImages) {
    failures.push(
      `Review needs at least ${QUALITY_THRESHOLDS.minBodyImages} inline images after enrichment.`,
    );
  }
  if (!checklist.productHeroImage) {
    failures.push("Product hero image is missing or uses an invalid URL.");
  }
  if (!checklist.minHeroImages) {
    failures.push(
      `Hero gallery needs at least ${QUALITY_THRESHOLDS.minHeroImages} images.`,
    );
  }

  return failures;
}

export async function evaluateReviewById(reviewId: string): Promise<ReviewQcReport> {
  const [row] = await db
    .select({
      review: reviews,
      product: products,
      keyword: keywords,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!row) {
    throw new Error("Review not found");
  }

  const assets = await db
    .select({ url: mediaAssets.url })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, row.product.id));

  const otherContents = await db
    .select({ id: reviews.id, content: reviews.content })
    .from(reviews)
    .where(eq(reviews.status, "published"));

  const targetKeyword =
    row.keyword?.keyword ??
    resolveFallbackKeyword(row.product.title, row.product.externalId);

  const keywordCheck = scoreKeywordRelevance({
    productTitle: row.product.title,
    externalId: row.product.externalId,
    campaignKeywords: [targetKeyword],
    targetKeyword,
  });

  const quality = evaluateReviewQuality({
    review: {
      title: row.review.title,
      content: row.review.content,
      metaDescription: row.review.metaDescription ?? "",
      pros: row.review.pros as string[],
      cons: row.review.cons as string[],
      rating: Number(row.review.rating),
      targetKeyword,
    },
    productSpecs: (row.product.specs ?? {}) as Record<string, unknown>,
    existingReviewContents: otherContents
      .filter((item) => item.id !== row.review.id)
      .map((item) => item.content),
    productTitle: row.product.title,
    externalId: row.product.externalId,
  });

  const publishReadiness = evaluatePublishReadiness({
    content: row.review.content,
    product: {
      title: row.product.title,
      externalId: row.product.externalId,
      imageUrl: row.product.imageUrl,
    },
    mediaAssets: assets,
  });

  const checklist = {
    ...quality.checklist,
    ...publishReadiness.checklist,
    keywordRelevance: keywordCheck.passed,
    seoKeywordInTitle: row.review.title
      .toLowerCase()
      .includes(targetKeyword.toLowerCase()),
    seoKeywordInContent: row.review.content
      .toLowerCase()
      .includes(targetKeyword.toLowerCase()),
  };

  const failures = buildFailures(checklist, keywordCheck.reason);
  const passed = failures.length === 0;
  const seoScore = Math.round(
    (quality.seoScore + keywordCheck.score) / 2,
  );
  const overallScore = Math.round(
    quality.wordCountScore * 0.25 +
      quality.uniquenessScore * 0.2 +
      quality.specAccuracyScore * 0.15 +
      seoScore * 0.25 +
      (keywordCheck.passed ? 15 : 0),
  );

  return {
    passed,
    overallScore,
    editorialScore: quality.overallScore,
    seoScore,
    wordCount: quality.wordCount,
    targetKeyword,
    checklist,
    failures,
    warnings: keywordCheck.reason && keywordCheck.passed ? [] : [],
  };
}

export async function persistReviewQcReport(reviewId: string, report: ReviewQcReport) {
  await db.insert(contentQualityScores).values({
    reviewId,
    wordCountScore: report.checklist.wordCountMin1500 ? 100 : 0,
    uniquenessScore: report.checklist.uniquenessThreshold ? 100 : 0,
    specAccuracyScore: report.checklist.specAccuracyPresent ? 100 : 0,
    seoScore: report.seoScore,
    overallScore: report.overallScore,
    checklist: report.checklist,
    passed: report.passed,
  });

  await db
    .update(reviews)
    .set({
      wordCount: report.wordCount,
      updatedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId));
}

export async function assertReviewPublishable(reviewId: string) {
  const report = await evaluateReviewById(reviewId);

  await persistReviewQcReport(reviewId, report);

  if (!report.passed) {
    throw new Error(`QC blocked publish: ${report.failures.join(" ")}`);
  }

  return report;
}

export async function getLatestQcReport(reviewId: string) {
  const [stored] = await db
    .select()
    .from(contentQualityScores)
    .where(eq(contentQualityScores.reviewId, reviewId))
    .orderBy(desc(contentQualityScores.evaluatedAt))
    .limit(1);

  return stored ?? null;
}

function resolveFallbackKeyword(productTitle: string, externalId: string) {
  if (externalId.includes("LAMP") || productTitle.toLowerCase().includes("lamp")) {
    return "desk lamp";
  }
  if (externalId.includes("DESK") || productTitle.toLowerCase().includes("desk")) {
    return "standing desk";
  }
  if (externalId.includes("CHAIR") || productTitle.toLowerCase().includes("chair")) {
    return "ergonomic office chair";
  }
  return `${productTitle} review`.slice(0, 120);
}
