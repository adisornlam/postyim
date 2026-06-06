import {
  MAX_DEMAND_SIGNALS,
  MAX_DISCOVERY_CANDIDATES,
  MAX_RISKS,
  MAX_SEARCHED_QUERIES,
  normalizeAsin,
  normalizeStringList,
  productDiscoveryResultSchema,
  type ProductDiscoveryResult,
} from "@/lib/ai/discovery-types";
import { ZodError } from "zod";

const ASIN_PATTERN = /B[0-9A-Z]{9}/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function coerceFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return undefined;
    }

    const parsed = Number(match[0]);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function coerceInteger(value: unknown): number | undefined {
  const parsed = coerceFiniteNumber(value);
  if (parsed === undefined) {
    return undefined;
  }

  return Math.max(0, Math.round(parsed));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return value.slice(0, max).trimEnd();
}

function padMinLength(value: string, min: number, fallback: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= min) {
    return trimmed;
  }

  const combined = trimmed ? `${trimmed}. ${fallback}` : fallback;
  return combined.length >= min ? combined : combined.padEnd(min, ".");
}

function extractAsin(value: unknown): string | undefined {
  const raw = asString(value).toUpperCase();
  const match = raw.match(ASIN_PATTERN);
  if (!match) {
    return undefined;
  }

  const asin = normalizeAsin(match[0]);
  return ASIN_PATTERN.test(asin) ? asin : undefined;
}

function normalizeStringListFromUnknown(value: unknown, max: number): string[] {
  if (Array.isArray(value)) {
    return normalizeStringList(
      value.map((item) => asString(item)).filter(Boolean),
      max,
    );
  }

  if (typeof value === "string" && value.trim()) {
    return normalizeStringList(
      value.split(/[\n;|]/).map((item) => item.trim()).filter(Boolean),
      max,
    );
  }

  return [];
}

function normalizeUrl(value: unknown): string | undefined {
  const raw = asString(value);
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function normalizeAmazonUrl(asin: string, value: unknown): string {
  return normalizeUrl(value) ?? `https://www.amazon.com/dp/${asin}`;
}

function normalizeCurrency(value: unknown): string {
  const raw = asString(value).toUpperCase();
  if (/^[A-Z]{3}$/.test(raw)) {
    return raw;
  }

  return "USD";
}

function normalizeCommissionRate(value: unknown): number {
  const parsed = coerceFiniteNumber(value);
  if (parsed === undefined) {
    return 0.04;
  }

  if (parsed > 1 && parsed <= 100) {
    return clampNumber(parsed / 100, 0, 1);
  }

  return clampNumber(parsed, 0, 1);
}

function normalizeScore(value: unknown, fallback = 70): number {
  const parsed = coerceFiniteNumber(value);
  if (parsed === undefined) {
    return fallback;
  }

  if (parsed > 100 && parsed <= 1000) {
    return clampNumber(Math.round(parsed / 10), 0, 100);
  }

  return clampNumber(Math.round(parsed), 0, 100);
}

function normalizeRating(value: unknown): number | undefined {
  const parsed = coerceFiniteNumber(value);
  if (parsed === undefined) {
    return undefined;
  }

  if (parsed > 5 && parsed <= 10) {
    return clampNumber(parsed / 2, 0, 5);
  }

  return clampNumber(parsed, 0, 5);
}

function normalizeDiscoveryCandidate(
  raw: unknown,
): Record<string, unknown> | null {
  const record = asRecord(raw);
  if (!record) {
    return null;
  }

  const asin = extractAsin(record.asin);
  if (!asin) {
    return null;
  }

  const titleRaw = asString(record.title);
  const title = truncate(
    titleRaw.length >= 3 ? titleRaw : `Amazon product ${asin}`,
    500,
  );

  const targetKeyword = truncate(
    padMinLength(asString(record.targetKeyword), 2, "best product review"),
    300,
  );

  const price = coerceFiniteNumber(record.price);
  const rating = normalizeRating(record.rating);
  const reviewCount = coerceInteger(record.reviewCount);

  let demandSignals = normalizeStringListFromUnknown(
    record.demandSignals,
    MAX_DEMAND_SIGNALS,
  );

  if (demandSignals.length === 0) {
    demandSignals = normalizeStringList(
      [
        reviewCount !== undefined
          ? `${reviewCount.toLocaleString()}+ Amazon reviews`
          : "Active Amazon shopper demand",
        `Commercial intent: "${targetKeyword}"`,
        "Suitable for editorial affiliate review",
      ],
      MAX_DEMAND_SIGNALS,
    );
  }

  const rationale = truncate(
    padMinLength(
      asString(record.rationale),
      20,
      "Strong affiliate potential based on Amazon research and sustained shopper demand.",
    ),
    2000,
  );

  const commissionCategory = truncate(
    asString(record.commissionCategory) || "Home & Kitchen",
    120,
  );

  const estimatedCommissionRate = normalizeCommissionRate(
    record.estimatedCommissionRate,
  );
  const normalizedPrice = price !== undefined && price > 0 ? price : undefined;
  const estimatedCommissionUsd =
    coerceFiniteNumber(record.estimatedCommissionUsd) ??
    (normalizedPrice !== undefined
      ? Math.round(normalizedPrice * estimatedCommissionRate * 100) / 100
      : undefined);

  const imageUrl = normalizeUrl(record.imageUrl);

  return {
    asin,
    title,
    targetKeyword,
    ...(normalizedPrice !== undefined ? { price: normalizedPrice } : {}),
    currency: normalizeCurrency(record.currency),
    ...(rating !== undefined ? { rating } : {}),
    ...(reviewCount !== undefined ? { reviewCount } : {}),
    amazonUrl: normalizeAmazonUrl(asin, record.amazonUrl),
    ...(imageUrl ? { imageUrl } : {}),
    commissionCategory,
    estimatedCommissionRate,
    ...(estimatedCommissionUsd !== undefined ? { estimatedCommissionUsd } : {}),
    demandScore: normalizeScore(record.demandScore),
    reviewFitScore: normalizeScore(record.reviewFitScore, 68),
    overallScore: normalizeScore(record.overallScore, 72),
    rationale,
    demandSignals,
    risks: normalizeStringListFromUnknown(record.risks, MAX_RISKS),
  };
}

export function normalizeDiscoveryPayload(
  raw: unknown,
  options?: { fallbackQueries?: string[] },
): {
  summary: string;
  searchedQueries: string[];
  candidates: Record<string, unknown>[];
} {
  const root = asRecord(raw) ?? {};

  let searchedQueries = normalizeStringListFromUnknown(
    root.searchedQueries,
    MAX_SEARCHED_QUERIES,
  );

  if (searchedQueries.length === 0 && options?.fallbackQueries?.length) {
    searchedQueries = normalizeStringList(
      options.fallbackQueries.map((keyword) => `site:amazon.com ${keyword}`),
      MAX_SEARCHED_QUERIES,
    );
  }

  if (searchedQueries.length === 0) {
    searchedQueries = ["site:amazon.com affiliate product research"];
  }

  const summary = truncate(
    padMinLength(
      asString(root.summary),
      10,
      "Product discovery summary from Amazon research.",
    ),
    2000,
  );

  const candidates = asArray(root.candidates)
    .map((candidate) => normalizeDiscoveryCandidate(candidate))
    .filter((candidate): candidate is Record<string, unknown> => candidate !== null)
    .sort(
      (left, right) =>
        (right.overallScore as number) - (left.overallScore as number),
    )
    .slice(0, MAX_DISCOVERY_CANDIDATES);

  return {
    summary,
    searchedQueries,
    candidates,
  };
}

export function formatDiscoveryValidationError(error: ZodError): string {
  const details = error.issues
    .map((issue) => {
      const field = issue.path.length > 0 ? issue.path.join(".") : "response";
      return `${field}: ${issue.message}`;
    })
    .join("; ");

  return `Discovery result validation failed (${details})`;
}

export function parseProductDiscoveryResult(
  raw: unknown,
  options?: { fallbackQueries?: string[] },
): ProductDiscoveryResult {
  const normalized = normalizeDiscoveryPayload(raw, options);

  if (normalized.candidates.length === 0) {
    throw new Error(
      "Discovery found no valid Amazon ASINs. Gemini may have invented IDs or omitted product data — try again or narrow campaign keywords.",
    );
  }

  try {
    return productDiscoveryResultSchema.parse(normalized);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatDiscoveryValidationError(error));
    }

    throw error;
  }
}
