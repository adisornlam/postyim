import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { campaigns, keywords } from "@/db/schema";
import {
  buildAmazonAffiliateLink,
  isLikelyMockAsin,
} from "@/lib/affiliate/links";
import { upsertProduct } from "@/lib/products/upsert";
import { getAmazonPartnerTag } from "@/lib/settings/runtime-config";

const manualProductSchema = z.object({
  campaignId: z.string().uuid(),
  externalId: z
    .string()
    .trim()
    .min(8, "ASIN must be at least 8 characters")
    .max(20),
  title: z.string().trim().min(3).max(500),
  description: z.string().trim().max(5000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default("USD"),
  affiliateLink: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  targetKeyword: z.string().trim().min(2).max(300).optional(),
  specs: z.record(z.string(), z.unknown()).optional(),
});

export async function createManualAmazonProduct(input: unknown) {
  const parsed = manualProductSchema.parse(input);

  if (isLikelyMockAsin(parsed.externalId)) {
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

  const affiliateLink =
    parsed.affiliateLink ??
    buildAmazonAffiliateLink(parsed.externalId, partnerTag);

  if (!affiliateLink.includes(partnerTag)) {
    throw new Error(`Affiliate link must include partner tag ${partnerTag}.`);
  }

  let keywordId: string | null = null;

  if (parsed.targetKeyword) {
    const [existingKeyword] = await db
      .select({ id: keywords.id })
      .from(keywords)
      .where(eq(keywords.keyword, parsed.targetKeyword))
      .limit(1);

    if (existingKeyword) {
      keywordId = existingKeyword.id;
    } else {
      const [createdKeyword] = await db
        .insert(keywords)
        .values({
          keyword: parsed.targetKeyword,
          intent: "commercial",
        })
        .returning({ id: keywords.id });

      keywordId = createdKeyword.id;
    }
  }

  const product = await upsertProduct({
    campaignId: campaign.id,
    categoryId: campaign.categoryId,
    affiliateNetwork: "amazon",
    rawProduct: {
      externalId: parsed.externalId.toUpperCase(),
      title: parsed.title,
      description: parsed.description,
      price: parsed.price,
      currency: parsed.currency.toUpperCase(),
      affiliateLink,
      imageUrl: parsed.imageUrl,
      specs: parsed.specs ?? {},
      rawData: {
        source: "manual",
        asin: parsed.externalId.toUpperCase(),
        targetKeyword: parsed.targetKeyword,
      },
    },
  });

  return {
    product,
    keywordId,
    affiliateLink,
  };
}
