import { getAmazonMarketplace } from "@/lib/env";

export function buildAmazonAffiliateLink(
  asin: string,
  partnerTag: string,
  region = "us-east-1",
): string {
  const marketplace = getAmazonMarketplace(region);
  const normalizedAsin = asin.trim().toUpperCase();
  const normalizedTag = partnerTag.trim();

  return `https://${marketplace.marketplace}/dp/${normalizedAsin}?tag=${normalizedTag}`;
}

export function isLikelyMockAsin(asin: string): boolean {
  return /mock/i.test(asin) || asin.startsWith("B0MOCK");
}
