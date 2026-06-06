import {
  AFFILIATE_DISCLOSURE_MARKERS,
  containsAiAuthorshipSignals,
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

const KEYWORD_STOP_WORDS = new Set(["for", "the", "and", "a", "an", "to", "in", "of"]);

export function contentIncludesTargetKeyword(
  content: string,
  targetKeyword: string,
): boolean {
  const normalizedContent = content.toLowerCase();
  const keyword = targetKeyword.trim().toLowerCase();

  if (!keyword) {
    return false;
  }

  if (normalizedContent.includes(keyword)) {
    return true;
  }

  const tokens = keyword
    .split(/\s+/)
    .filter((word) => word.length > 2 && !KEYWORD_STOP_WORDS.has(word));

  return tokens.length > 0 && tokens.every((token) => normalizedContent.includes(token));
}

export { countWords };

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

const KEY_SPEC_FIELDS = [
  "brand",
  "wattage",
  "brightness",
  "model",
  "dimensions",
  "colorTemperatures",
  "control",
  "powerSource",
  "material",
  "bestSellerRank",
  "memoryFunction",
  "colorModes",
  "brightnessLevels",
] as const;

const FACT_KEYWORD_PATTERNS = [
  /\d+\.?\d*w\b/gi,
  /\d+\s*(?:lm|lumens?)\b/gi,
  /\d{4}k/gi,
  /touch control/gi,
  /memory function/gi,
  /adjustable/gi,
  /100-240v/gi,
  /\b12v\b/gi,
  /non-flickering/gi,
  /eye[- ]care/gi,
];

function addSpecString(terms: Set<string>, value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length <= 2) {
    return;
  }

  terms.add(normalized);

  for (const match of normalized.matchAll(/[\d.]+(?:\s*(?:w|lm|inch|k|v))?/g)) {
    const token = match[0].trim();
    if (token.length > 1) {
      terms.add(token);
    }
  }
}

function extractSpecTerms(specs: Record<string, unknown>): string[] {
  const terms = new Set<string>();

  for (const key of KEY_SPEC_FIELDS) {
    const value = specs[key];

    if (typeof value === "string") {
      addSpecString(terms, value);
      continue;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      terms.add(String(value));
      continue;
    }

    if (value === true && key === "memoryFunction") {
      terms.add("memory");
    }
  }

  const verifiedFacts = specs.verifiedFacts;
  if (Array.isArray(verifiedFacts)) {
    for (const fact of verifiedFacts) {
      if (typeof fact !== "string") {
        continue;
      }

      for (const pattern of FACT_KEYWORD_PATTERNS) {
        for (const match of fact.matchAll(pattern)) {
          terms.add(match[0].toLowerCase());
        }
      }
    }
  }

  return [...terms].filter((term) => term.length > 2);
}

function specTermMatchesContent(content: string, term: string): boolean {
  const normalized = term.toLowerCase();

  if (content.includes(normalized)) {
    return true;
  }

  if (/^\d+\.?\d*w$/.test(normalized)) {
    const num = normalized.replace("w", "");
    return content.includes(num) && /\bw\b|watt/.test(content);
  }

  if (normalized.includes("lm")) {
    const num = normalized.match(/[\d.]+/)?.[0];
    return Boolean(num && content.includes(num) && /lumens?\b|\blm\b/.test(content));
  }

  if (/^\d{4}k$/.test(normalized)) {
    return content.includes(normalized);
  }

  if (normalized.includes("-")) {
    return normalized
      .split("-")
      .some((part) => part.length > 3 && content.includes(part));
  }

  if (/^[\d.]+/.test(normalized)) {
    const num = normalized.match(/^[\d.]+/)?.[0];
    return Boolean(num && content.includes(num));
  }

  return false;
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

function hasAiAuthorshipSignals(review: GeneratedReview): boolean {
  return (
    containsAiAuthorshipSignals(review.content) ||
    containsAiAuthorshipSignals(review.metaDescription) ||
    containsAiAuthorshipSignals(review.title)
  );
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

  if (contentIncludesTargetKeyword(review.content, review.targetKeyword)) {
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
  const specTerms = extractSpecTerms(input.productSpecs);
  const normalizedContent = input.review.content.toLowerCase();
  const matchedSpecs = specTerms.filter((term) =>
    specTermMatchesContent(normalizedContent, term),
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
    noAiAuthorshipSignals: !hasAiAuthorshipSignals(input.review),
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
    seoKeywordInContent: contentIncludesTargetKeyword(
      normalizedContent,
      input.review.targetKeyword,
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
