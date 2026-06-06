import { z } from "zod";

const asinSchema = z
  .string()
  .trim()
  .regex(/^B[0-9A-Z]{9}$/i, "ASIN must be a 10-character Amazon identifier (B0…).");

export const discoveryCandidateSchema = z.object({
  asin: asinSchema,
  title: z.string().trim().min(3).max(500),
  targetKeyword: z.string().trim().min(2).max(300),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  amazonUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  commissionCategory: z.string().trim().min(1).max(120),
  estimatedCommissionRate: z.number().min(0).max(1),
  estimatedCommissionUsd: z.number().nonnegative().optional(),
  demandScore: z.number().min(0).max(100),
  reviewFitScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  rationale: z.string().trim().min(20).max(2000),
  demandSignals: z.array(z.string().trim().min(1)).min(1).max(6),
  risks: z.array(z.string().trim().min(1)).max(4).default([]),
});

export type DiscoveryCandidate = z.infer<typeof discoveryCandidateSchema>;

export const MAX_SEARCHED_QUERIES = 12;

export function normalizeSearchedQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(trimmed);

    if (output.length >= MAX_SEARCHED_QUERIES) {
      break;
    }
  }

  return output;
}

export const productDiscoveryResultSchema = z.object({
  summary: z.string().trim().min(10).max(2000),
  searchedQueries: z
    .array(z.string())
    .transform(normalizeSearchedQueries)
    .pipe(z.array(z.string().trim().min(1)).min(1).max(MAX_SEARCHED_QUERIES)),
  candidates: z.array(discoveryCandidateSchema).min(1).max(10),
});

export type ProductDiscoveryResult = z.infer<typeof productDiscoveryResultSchema>;

export function normalizeAsin(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidAsin(value: string): boolean {
  return asinSchema.safeParse(value).success;
}
