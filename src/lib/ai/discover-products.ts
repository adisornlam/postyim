import { eq } from "drizzle-orm";

import { db } from "@/db";
import { campaigns, categories, products } from "@/db/schema";
import {
  generateDiscoveryJson,
  getReviewGenerationModel,
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
  buildProductDiscoveryStructurePrompt,
  productDiscoveryJsonSchema,
  type ProductDiscoveryGeminiPayload,
} from "@/lib/ai/prompts/discover-products";
import { parseAmazonCampaignConfig, parseCampaignKeywords } from "@/lib/affiliate/types";
import { reportDiscoveryProgress } from "@/lib/ai/discovery-progress";
import {
  getGeminiModelDraft,
  shouldUseGeminiMock,
} from "@/lib/settings/runtime-config";

export interface DiscoverProductsInput {
  campaignId: string;
  limit?: number;
  jobRunId?: string;
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

  await reportDiscoveryProgress(input.jobRunId, {
    phase: "prepare",
    message: `Loaded campaign "${row.campaign.name}" with ${keywords.length} keyword${keywords.length === 1 ? "" : "s"}`,
  });

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

  const searchPrompt = buildProductDiscoveryPrompt({
    campaignName: row.campaign.name,
    categoryName: row.category?.name,
    keywords,
    limit,
    excludeAsins,
    minPrice: config.minPrice,
    maxPrice: config.maxPrice,
    minRating: config.minRating,
  });

  const model = await getReviewGenerationModel();
  const searchModel = await getGeminiModelDraft();

  await reportDiscoveryProgress(input.jobRunId, {
    phase: "search",
    message: `Searching Amazon via Google for: ${keywords.slice(0, 3).join(", ")}${keywords.length > 3 ? "…" : ""} (may take 1–2 minutes)`,
  });

  const response = await generateDiscoveryJson<ProductDiscoveryGeminiPayload>({
    model,
    searchModel,
    searchPrompt,
    structurePrompt: buildProductDiscoveryStructurePrompt({ limit }),
    schema: productDiscoveryJsonSchema,
    onSearchComplete: async (researchPreview) => {
      const queryMatches = researchPreview.match(/(?:query|search)[^:\n]*:\s*(.+)/gi);
      const previewQueries = queryMatches?.slice(0, 3).map((line) => line.trim()) ?? [];

      await reportDiscoveryProgress(input.jobRunId, {
        phase: "search",
        message: previewQueries.length
          ? `Research complete — ${previewQueries.length} search angle${previewQueries.length === 1 ? "" : "s"} covered`
          : "Research complete — structuring product candidates",
      });
    },
    onStructureStart: async () => {
      await reportDiscoveryProgress(input.jobRunId, {
        phase: "structure",
        message: "Structuring candidates into ranked JSON…",
      });
    },
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

  const finalCandidates = dedupeCandidates(filtered).slice(0, limit);

  await reportDiscoveryProgress(input.jobRunId, {
    phase: "finalize",
    message: `${finalCandidates.length} candidate${finalCandidates.length === 1 ? "" : "s"} ready after filtering duplicates`,
    searchedQueries: parsed.searchedQueries,
    candidateCount: finalCandidates.length,
  });

  return {
    mode: "live",
    model,
    campaignId: row.campaign.id,
    campaignName: row.campaign.name,
    result: {
      ...parsed,
      candidates: finalCandidates,
    },
    usage: response.usage,
  };
}
