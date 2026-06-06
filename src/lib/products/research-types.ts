import { z } from "zod";

export const productResearchImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().min(1).max(300).optional(),
});

export const productResearchSchema = z.object({
  asin: z.string().trim().min(8).max(20),
  source: z.literal("amazon-research"),
  researchedAt: z.string().datetime(),
  title: z.string().trim().min(3).max(500),
  description: z.string().trim().max(5000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  targetKeyword: z.string().trim().min(2).max(300),
  campaignId: z.string().uuid().optional(),
  bullets: z.array(z.string().trim().min(1)).min(1),
  verifiedFacts: z.array(z.string().trim().min(1)).min(1),
  specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  productImages: z.array(productResearchImageSchema).min(1),
  amazonUrl: z.string().url().optional(),
});

export type ProductResearch = z.infer<typeof productResearchSchema>;

export function extractProductResearch(rawData: unknown): ProductResearch | null {
  if (!rawData || typeof rawData !== "object") {
    return null;
  }

  const candidate = (rawData as { research?: unknown }).research;
  if (!candidate) {
    return null;
  }

  const parsed = productResearchSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}
