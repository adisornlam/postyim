import { eq } from "drizzle-orm";

import { db } from "@/db";
import { campaigns, categories, products } from "@/db/schema";
import {
  generateDiscoveryJson,
  getQualityEvaluationModel,
} from "@/lib/ai/gemini/client";
import {
  discoveryCandidateSchema,
  normalizeAsin,
  productDiscoveryResultSchema,
  type DiscoveryCandidate,
  type ProductDiscoveryResult,
} from "@/lib/ai/discovery-types";
import { generateMockProductDiscovery } from "@/lib/ai/mock/discover-products";
import {
  buildProductDiscoveryPrompt,
  productDiscoveryJsonSchema,
  type ProductDiscoveryGeminiPayload,
} from "@/lib/ai/prompts/discover-products";
import { parseAmazonCampaignConfig, parseCampaignKeywords } from "@/lib/affiliate/types";
import { shouldUseGeminiMock } from "@/lib/settings/runtime-config";

export interface DiscoverProductsInput {
  campaignId: string;
  limit?: number;
}

export interface DiscoverProductsOutput {
  mode: "live" | "mock";
  model?: string;
  campaignId: string;
  campaignName: string;
  result: ProductDiscoveryResult;
  usage?: { promptTokens?: number; outputTokens?: number };
}

function dedupeCandidates(candidates: DiscoveryCandidate[]): DiscoveryCandidate[] {
  const seen = new Set<string>();
  const output: DiscoveryCandidate[] = [];

  for (const candidate of candidates) {
    const asin = normalizeAsin(candidate.asin);

    if (seen.has(asin)) {
      continue;
    }

    seen.add(asin);
    output.push({ ...candidate, asin });
  }

  return output.sort((a, b) => b.overallScore - a.overallScore);
}

export async function discoverProductsForCampaign(
  input: DiscoverProductsInput,
): Promise<DiscoverProductsOutput> {
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 10);

  const [row] = await db
    .select({
      campaign: campaigns,
      category: categories,
    })
    .from(campaigns)
    .leftJoin(categories, eq(categories.id, campaigns.categoryId))
    .where(eq(campaigns.id, input.campaignId))
    .limit(1);

  if (!row) {
    throw new Error("Campaign not found.");
  }

  if (row.campaign.status !== "active") {
    throw new Error(`Campaign "${row.campaign.slug}" is not active.`);
  }

  const keywords = parseCampaignKeywords(row.campaign.keywords);

  if (keywords.length === 0) {
    throw new Error("Campaign has no keywords configured.");
  }

  const config = parseAmazonCampaignConfig(row.campaign.config);

  const existingProducts = await db
    .select({ externalId: products.externalId })
    .from(products)
    .where(eq(products.campaignId, row.campaign.id));

  const excludeAsins = existingProducts.map((p) => p.externalId.toUpperCase());

  if (await shouldUseGeminiMock()) {
    const mockResult = generateMockProductDiscovery({
      campaignName: row.campaign.name,
      keywords,
      limit,
    });

    const filtered = mockResult.candidates.filter(
      (c) => !excludeAsins.includes(normalizeAsin(c.asin)),
    );

    return {
      mode: "mock",
      campaignId: row.campaign.id,
      campaignName: row.campaign.name,
      result: {
        ...mockResult,
        candidates: dedupeCandidates(filtered).slice(0, limit),
      },
    };
  }

  const prompt = buildProductDiscoveryPrompt({
    campaignName: row.campaign.name,
    categoryName: row.category?.name,
    keywords,
    limit,
    excludeAsins,
    minPrice: config.minPrice,
    maxPrice: config.maxPrice,
    minRating: config.minRating,
  });

  const model = await getQualityEvaluationModel();

  const response = await generateDiscoveryJson<ProductDiscoveryGeminiPayload>({
    model,
    prompt,
    schema: productDiscoveryJsonSchema,
  });

  const parsed = productDiscoveryResultSchema.parse({
    ...response.data,
    candidates: response.data.candidates.map((candidate) =>
      discoveryCandidateSchema.parse({
        ...candidate,
        asin: normalizeAsin(candidate.asin),
        currency: candidate.currency?.toUpperCase() ?? "USD",
        risks: candidate.risks ?? [],
      }),
    ),
  });

  const filtered = parsed.candidates.filter(
    (c) => !excludeAsins.includes(normalizeAsin(c.asin)),
  );

  return {
    mode: "live",
    model,
    campaignId: row.campaign.id,
    campaignName: row.campaign.name,
    result: {
      ...parsed,
      candidates: dedupeCandidates(filtered).slice(0, limit),
    },
    usage: response.usage,
  };
}
