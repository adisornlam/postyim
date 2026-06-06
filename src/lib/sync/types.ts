export const SYNC_BUNDLE_VERSION = 1 as const;

export interface SyncCampaignPayload {
  slug: string;
  name: string;
  keywords: string[];
  affiliateNetwork: "amazon";
  status: "active" | "paused" | "archived";
  config?: Record<string, unknown>;
  dailyProductLimit?: number;
  categorySlug?: string;
}

export interface SyncKeywordPayload {
  keyword: string;
  intent?: "commercial" | "informational" | "transactional" | "comparison";
}

export interface SyncMediaAssetPayload {
  url: string;
  altText?: string | null;
  sortOrder: number;
}

export interface SyncProductPayload {
  campaignSlug: string;
  externalId: string;
  title: string;
  description?: string | null;
  price?: string | null;
  currency: string;
  affiliateLink: string;
  imageUrl?: string | null;
  specs?: Record<string, unknown>;
  rawData?: unknown;
  categorySlug?: string;
  mediaAssets?: SyncMediaAssetPayload[];
}

export interface SyncReviewPayload {
  slug: string;
  title: string;
  metaDescription?: string | null;
  content: string;
  pros: string[];
  cons: string[];
  rating?: string | null;
  status: string;
  wordCount?: number | null;
  targetKeyword?: string;
  authorSlug?: string;
  publishedAt?: string | null;
}

export interface SyncQualityScorePayload {
  wordCountScore?: number | null;
  uniquenessScore?: number | null;
  specAccuracyScore?: number | null;
  seoScore?: number | null;
  overallScore?: number | null;
  checklist: Record<string, boolean>;
  passed: boolean;
}

export interface SyncBundle {
  version: typeof SYNC_BUNDLE_VERSION;
  exportedAt: string;
  product: SyncProductPayload;
  review?: SyncReviewPayload;
  keyword?: SyncKeywordPayload;
  campaign?: SyncCampaignPayload;
  qualityScore?: SyncQualityScorePayload;
}

export interface SyncPushResult {
  productId: string;
  reviewId?: string;
  productSlug: string;
  reviewSlug?: string;
  reviewStatus?: string;
  created: {
    campaign: boolean;
    keyword: boolean;
    product: boolean;
    review: boolean;
  };
}
