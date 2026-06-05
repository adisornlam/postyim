import { pgEnum } from "drizzle-orm/pg-core";

export const affiliateNetworkEnum = pgEnum("affiliate_network", [
  "amazon",
  "clickbank",
  "cj",
  "shareasale",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "active",
  "paused",
  "archived",
]);

export const productSyncStatusEnum = pgEnum("product_sync_status", [
  "pending",
  "synced",
  "failed",
  "discontinued",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "draft",
  "generating",
  "pending_review",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "failed",
  "archived",
]);

export const keywordIntentEnum = pgEnum("keyword_intent", [
  "informational",
  "commercial",
  "transactional",
  "comparison",
]);

export const keywordDifficultyEnum = pgEnum("keyword_difficulty", [
  "low",
  "medium",
  "high",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const jobTypeEnum = pgEnum("job_type", [
  "product_ingestion",
  "price_refresh",
  "content_generation",
  "quality_check",
  "sitemap_generation",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const logLevelEnum = pgEnum("log_level", [
  "debug",
  "info",
  "warn",
  "error",
]);
