import {
  commissionRateLabel,
  estimateAmazonCommissionRate,
} from "@/lib/affiliate/amazon-commission-rates";
import type { ProductDiscoveryResult } from "@/lib/ai/discovery-types";

export const productDiscoveryJsonSchema: Record<string, unknown> = {
  type: "object",
  properties: {
    summary: { type: "string" },
    searchedQueries: {
      type: "array",
      items: { type: "string" },
      maxItems: 6,
    },
    candidates: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          asin: { type: "string" },
          title: { type: "string" },
          targetKeyword: { type: "string" },
          price: { type: "number" },
          currency: { type: "string" },
          rating: { type: "number" },
          reviewCount: { type: "number" },
          amazonUrl: { type: "string" },
          imageUrl: { type: "string" },
          commissionCategory: { type: "string" },
          estimatedCommissionRate: { type: "number" },
          estimatedCommissionUsd: { type: "number" },
          demandScore: { type: "number" },
          reviewFitScore: { type: "number" },
          overallScore: { type: "number" },
          rationale: { type: "string" },
          demandSignals: {
            type: "array",
            items: { type: "string" },
            maxItems: 6,
          },
          risks: {
            type: "array",
            items: { type: "string" },
            maxItems: 4,
          },
        },
        required: [
          "asin",
          "title",
          "targetKeyword",
          "commissionCategory",
          "estimatedCommissionRate",
          "demandScore",
          "reviewFitScore",
          "overallScore",
          "rationale",
          "demandSignals",
        ],
      },
    },
  },
  required: ["summary", "searchedQueries", "candidates"],
};

export function buildProductDiscoveryPrompt(input: {
  campaignName: string;
  categoryName?: string | null;
  keywords: string[];
  limit: number;
  excludeAsins: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}): string {
  const { category: defaultCommissionCategory, rate: defaultRate } =
    estimateAmazonCommissionRate({ categoryName: input.categoryName });

  const priceHint =
    input.minPrice !== undefined || input.maxPrice !== undefined
      ? `Price window: ${input.minPrice ?? 0}–${input.maxPrice ?? 500} USD.`
      : "Prefer products priced roughly $25–$150 USD for affiliate ROI (adjust if category differs).";

  const excludeBlock =
    input.excludeAsins.length > 0
      ? `\nDo NOT recommend these ASINs (already in catalog): ${input.excludeAsins.join(", ")}`
      : "";

  return `You are an affiliate product research analyst for Postyim, an editorial Amazon review site.

Use Google Search to find REAL, currently sold Amazon US products suitable for in-depth affiliate reviews.

Run at most 3 focused Google searches (combine keywords efficiently — do not run separate searches for every seed keyword).

Campaign: ${input.campaignName}
Category focus: ${input.categoryName ?? "General home & lifestyle"}
Seed keywords: ${input.keywords.join(", ")}
${priceHint}
${input.minRating !== undefined ? `Minimum rating target: ${input.minRating}/5.` : "Prefer products rated 4.0+ with strong review volume."}
Default commission category hint: ${defaultCommissionCategory} (~${commissionRateLabel(defaultRate)}).
${excludeBlock}

Selection criteria (rank by overall affiliate + editorial value):
1. Sustained commercial demand — shoppers actively search "best X for Y" style queries; avoid fad products past peak interest.
2. NOT just legacy bestsellers with fading demand — favor steady home-office / daily-use categories over one-season hype.
3. Review-worthy differentiation — enough specs/pros/cons for a 1,500+ word editorial review.
4. Commission value — estimate Amazon Associates commission using category rates; higher-priced items in higher-rate categories score better when demand is comparable.
5. Social proof — prefer thousands of reviews when possible; note review count in demandSignals.
6. Real ASINs only — each ASIN must appear on amazon.com/dp/ASIN. Never invent ASINs.

Return exactly ${input.limit} candidates, sorted by overallScore (highest first).

For each candidate, write a numbered section in plain text with:
- asin (10 chars, starts with B)
- title (Amazon listing title)
- targetKeyword (commercial SEO phrase, e.g. "best LED desk lamp for home office")
- price, currency (USD), rating, reviewCount when findable
- amazonUrl (https://www.amazon.com/dp/ASIN)
- imageUrl (direct product image URL if findable)
- commissionCategory, estimatedCommissionRate (decimal e.g. 0.045), estimatedCommissionUsd
- demandScore, reviewFitScore, overallScore (0–100)
- rationale (2–3 sentences: why this is worth reviewing now)
- demandSignals (bullet-style strings: review volume, search intent, use case)
- risks (0–3 strings: smart-home gaps, low commission, saturated niche, etc.)

Also list the Google search queries you used.`;
}

export function buildProductDiscoveryStructurePrompt(input: {
  limit: number;
}): string {
  return `Convert the research notes below into structured JSON for Postyim product discovery.

Rules:
- Output ONLY valid JSON matching the required schema (no markdown).
- Include up to ${input.limit} candidates, sorted by overallScore descending.
- Use only ASINs mentioned in the research notes. Never invent ASINs.
- Normalize ASINs to uppercase 10-character Amazon IDs starting with B.
- Omit optional fields when unknown — do not guess prices, ratings, or URLs.
- Hard limits (extra items or out-of-range values will be discarded):
  - summary: 10–2000 chars
  - searchedQueries: 1–6 unique strings
  - candidates: 1–${input.limit}
  - title: 3–500 chars; targetKeyword: 2–300 chars; rationale: 20–2000 chars
  - demandSignals: 1–6 strings per candidate; risks: 0–4 strings
  - scores (demandScore, reviewFitScore, overallScore): integers 0–100
  - estimatedCommissionRate: decimal 0–1 (e.g. 0.045 for 4.5%, NOT 4.5)
  - rating: 0–5; reviewCount: non-negative integer
  - currency: 3-letter code (USD when price is present)`;
}

export type ProductDiscoveryGeminiPayload = ProductDiscoveryResult;
