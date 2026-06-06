import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { campaigns, keywords } from "@/db/schema";
import {
  discoveryCandidateSchema,
  normalizeAsin,
  type DiscoveryCandidate,
} from "@/lib/ai/discovery-types";
import {
  buildAmazonAffiliateLink,
  isLikelyMockAsin,
} from "@/lib/affiliate/links";
import { upsertProduct } from "@/lib/products/upsert";
import { getAmazonPartnerTag } from "@/lib/settings/runtime-config";

const importDiscoverySchema = z.object({
  campaignId: z.string().uuid(),
  candidate: discoveryCandidateSchema,
});

export async function importDiscoveryCandidate(input: unknown) {
  const parsed = importDiscoverySchema.parse(input);
  const candidate = parsed.candidate;
  const asin = normalizeAsin(candidate.asin);

  if (isLikelyMockAsin(asin)) {
    throw new Error("Use a real Amazon ASIN, not a mock catalog ID.");
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, parsed.campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const partnerTag = await getAmazonPartnerTag();

  if (!partnerTag) {
    throw new Error(
      "Partner tag is not configured. Save it in Admin → Settings → Integrations.",
    );
  }

  const affiliateLink = buildAmazonAffiliateLink(asin, partnerTag);

  const [existingKeyword] = await db
    .select({ id: keywords.id })
    .from(keywords)
    .where(eq(keywords.keyword, candidate.targetKeyword))
    .limit(1);

  let keywordId: string;

  if (existingKeyword) {
    keywordId = existingKeyword.id;
  } else {
    const [createdKeyword] = await db
      .insert(keywords)
      .values({
        keyword: candidate.targetKeyword,
        intent: "commercial",
      })
      .returning({ id: keywords.id });

    keywordId = createdKeyword.id;
  }

  const product = await upsertProduct({
    campaignId: campaign.id,
    categoryId: campaign.categoryId,
    affiliateNetwork: "amazon",
    rawProduct: {
      externalId: asin,
      title: candidate.title,
      description: candidate.rationale,
      price: candidate.price,
      currency: candidate.currency.toUpperCase(),
      affiliateLink,
      imageUrl: candidate.imageUrl,
      specs: {
        rating: candidate.rating,
        reviewCount: candidate.reviewCount,
        commissionCategory: candidate.commissionCategory,
        estimatedCommissionRate: candidate.estimatedCommissionRate,
        estimatedCommissionUsd: candidate.estimatedCommissionUsd,
        discoveryScores: {
          demand: candidate.demandScore,
          reviewFit: candidate.reviewFitScore,
          overall: candidate.overallScore,
        },
      },
      rawData: {
        source: "gemini-discovery",
        asin,
        targetKeyword: candidate.targetKeyword,
        discoveredAt: new Date().toISOString(),
        discovery: sanitizeDiscoveryForStorage(candidate),
      },
    },
  });

  return {
    product,
    keywordId,
    affiliateLink,
  };
}

function sanitizeDiscoveryForStorage(
  candidate: DiscoveryCandidate,
): DiscoveryCandidate {
  return {
    ...candidate,
    asin: normalizeAsin(candidate.asin),
  };
}
