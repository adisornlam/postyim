import {
  AFFILIATE_DISCLOSURE_MARKERS,
  DEFAULT_DISCLOSURE,
  PROHIBITED_PHRASES,
  QUALITY_THRESHOLDS,
} from "@/lib/ai/constants";
import type { GeneratedReview, QualityGateInput, QualityGateResult } from "@/lib/ai/types";
import { scoreKeywordRelevance } from "@/lib/seo/resolve-target-keyword";

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "have",
  "are",
  "was",
  "were",
  "into",
  "about",
  "they",
  "their",
  "you",
  "our",
  "but",
  "not",
  "can",
  "will",
  "its",
  "it's",
  "a",
  "an",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "or",
  "as",
  "is",
  "be",
  "it",
]);

function countWords(text: string): number {
  return text
    .replace(/[#*_`>\[\]()!-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function extractSpecTerms(specs: Record<string, unknown>): string[] {
  const terms = new Set<string>();

  const visit = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 2) {
      terms.add(value.trim().toLowerCase());
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    if (value && typeof value === "object") {
      Object.values(value).forEach(visit);
    }
  };

  visit(specs);
  return [...terms];
}

function hasDisclosure(content: string): boolean {
  const normalized = content.toLowerCase();
  return AFFILIATE_DISCLOSURE_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

function hasProhibitedPhrases(content: string): boolean {
  const normalized = content.toLowerCase();
  return PROHIBITED_PHRASES.some((phrase) => normalized.includes(phrase));
}

function scoreWordCount(wordCount: number): number {
  if (wordCount >= QUALITY_THRESHOLDS.minWordCount) {
    return 100;
  }

  return Math.max(0, Math.round((wordCount / QUALITY_THRESHOLDS.minWordCount) * 100));
}

function scoreUniqueness(uniqueness: number): number {
  return Math.round(uniqueness * 100);
}

function scoreSpecAccuracy(found: number, total: number): number {
  if (total === 0) {
    return 100;
  }

  return Math.round((found / total) * 100);
}

function scoreSeo(review: GeneratedReview): number {
  let score = 0;

  if (
    review.metaDescription.length >= QUALITY_THRESHOLDS.metaDescriptionMin &&
    review.metaDescription.length <= QUALITY_THRESHOLDS.metaDescriptionMax
  ) {
    score += 40;
  }

  if (review.title.toLowerCase().includes(review.targetKeyword.toLowerCase())) {
    score += 30;
  }

  if (review.content.toLowerCase().includes(review.targetKeyword.toLowerCase())) {
    score += 30;
  }

  return score;
}

export function evaluateReviewQuality(input: QualityGateInput): QualityGateResult {
  const wordCount = countWords(input.review.content);
  const currentTokens = tokenize(input.review.content);

  let maxSimilarity = 0;

  for (const existing of input.existingReviewContents) {
    maxSimilarity = Math.max(
      maxSimilarity,
      jaccardSimilarity(currentTokens, tokenize(existing)),
    );
  }

  const uniqueness = 1 - maxSimilarity;
  const specTerms = extractSpecTerms(input.productSpecs).slice(0, 8);
  const normalizedContent = input.review.content.toLowerCase();
  const matchedSpecs = specTerms.filter((term) =>
    normalizedContent.includes(term.toLowerCase()),
  ).length;

  const keywordRelevance =
    input.productTitle && input.externalId
      ? scoreKeywordRelevance({
          productTitle: input.productTitle,
          externalId: input.externalId,
          campaignKeywords: [input.review.targetKeyword],
          targetKeyword: input.review.targetKeyword,
        })
      : { score: 100, passed: true };

  const checklist = {
    wordCountMin1500: wordCount >= QUALITY_THRESHOLDS.minWordCount,
    hasProsCons:
      input.review.pros.length >= QUALITY_THRESHOLDS.minPros &&
      input.review.cons.length >= QUALITY_THRESHOLDS.minCons,
    hasDisclosure: hasDisclosure(input.review.content),
    noProhibitedPhrases: !hasProhibitedPhrases(input.review.content),
    metaDescriptionLength:
      input.review.metaDescription.length >=
        QUALITY_THRESHOLDS.metaDescriptionMin &&
      input.review.metaDescription.length <=
        QUALITY_THRESHOLDS.metaDescriptionMax,
    ratingWithJustification:
      Number.isFinite(input.review.rating) &&
      input.review.rating >= 1 &&
      input.review.rating <= 5,
    uniquenessThreshold:
      scoreUniqueness(uniqueness) >= QUALITY_THRESHOLDS.minUniquenessScore,
    specAccuracyPresent:
      specTerms.length === 0 ||
      scoreSpecAccuracy(matchedSpecs, specTerms.length) >= 60,
    keywordRelevance: keywordRelevance.passed,
    seoKeywordInTitle: input.review.title
      .toLowerCase()
      .includes(input.review.targetKeyword.toLowerCase()),
    seoKeywordInContent: normalizedContent.includes(
      input.review.targetKeyword.toLowerCase(),
    ),
  };

  const wordCountScore = scoreWordCount(wordCount);
  const uniquenessScore = scoreUniqueness(uniqueness);
  const specAccuracyScore = scoreSpecAccuracy(matchedSpecs, specTerms.length);
  const seoScore = scoreSeo(input.review);
  const overallScore = Math.round(
    wordCountScore * 0.25 +
      uniquenessScore * 0.2 +
      specAccuracyScore * 0.15 +
      seoScore * 0.2 +
      keywordRelevance.score * 0.2,
  );

  const passed = Object.values(checklist).every(Boolean);

  return {
    passed,
    wordCountScore,
    uniquenessScore,
    specAccuracyScore,
    seoScore,
    overallScore,
    checklist,
    wordCount,
  };
}

export function ensureDisclosure(content: string): string {
  if (hasDisclosure(content)) {
    return content;
  }

  return `${content.trim()}\n\n${DEFAULT_DISCLOSURE}`;
}
