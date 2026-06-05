export type AffiliateNetwork = "amazon" | "clickbank" | "cj" | "shareasale";

export interface SearchParams {
  keywords: string;
  searchIndex?: string;
  itemCount?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
}

export interface RawProduct {
  externalId: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  affiliateLink: string;
  imageUrl?: string;
  specs: Record<string, unknown>;
  rawData: unknown;
}

export interface AffiliateAdapter {
  network: AffiliateNetwork;
  searchProducts(params: SearchParams): Promise<RawProduct[]>;
  getProduct(externalId: string): Promise<RawProduct>;
  buildAffiliateLink(externalId: string): string;
}

export interface AmazonCampaignConfig {
  searchIndex?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  itemCount?: number;
}

export function parseAmazonCampaignConfig(
  config: unknown,
): AmazonCampaignConfig {
  if (!config || typeof config !== "object") {
    return {};
  }

  const value = config as Record<string, unknown>;

  return {
    searchIndex:
      typeof value.searchIndex === "string" ? value.searchIndex : undefined,
    minPrice: typeof value.minPrice === "number" ? value.minPrice : undefined,
    maxPrice: typeof value.maxPrice === "number" ? value.maxPrice : undefined,
    minRating:
      typeof value.minRating === "number" ? value.minRating : undefined,
    itemCount: typeof value.itemCount === "number" ? value.itemCount : undefined,
  };
}

export function parseCampaignKeywords(keywords: unknown): string[] {
  if (!Array.isArray(keywords)) {
    return [];
  }

  return keywords.filter(
    (keyword): keyword is string =>
      typeof keyword === "string" && keyword.trim().length > 0,
  );
}
