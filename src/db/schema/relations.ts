import { relations } from "drizzle-orm";
import { affiliateClicks } from "./affiliate-clicks";
import { authors } from "./authors";
import { campaigns } from "./campaigns";
import { categories } from "./categories";
import { contentQualityScores } from "./content-quality-scores";
import { cronLogs } from "./cron-logs";
import { jobRuns } from "./job-runs";
import { keywords } from "./keywords";
import { mediaAssets } from "./media-assets";
import { products } from "./products";
import { reviewVersions } from "./review-versions";
import { reviews } from "./reviews";

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryHierarchy",
  }),
  children: many(categories, { relationName: "categoryHierarchy" }),
  campaigns: many(campaigns),
  products: many(products),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  category: one(categories, {
    fields: [campaigns.categoryId],
    references: [categories.id],
  }),
  products: many(products),
  jobRuns: many(jobRuns),
}));

export const authorsRelations = relations(authors, ({ many }) => ({
  reviews: many(reviews),
}));

export const keywordsRelations = relations(keywords, ({ many }) => ({
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [products.campaignId],
    references: [campaigns.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  review: one(reviews),
  mediaAssets: many(mediaAssets),
  affiliateClicks: many(affiliateClicks),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  author: one(authors, {
    fields: [reviews.authorId],
    references: [authors.id],
  }),
  keyword: one(keywords, {
    fields: [reviews.keywordId],
    references: [keywords.id],
  }),
  versions: many(reviewVersions),
  qualityScores: many(contentQualityScores),
  affiliateClicks: many(affiliateClicks),
}));

export const reviewVersionsRelations = relations(reviewVersions, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewVersions.reviewId],
    references: [reviews.id],
  }),
}));

export const contentQualityScoresRelations = relations(
  contentQualityScores,
  ({ one }) => ({
    review: one(reviews, {
      fields: [contentQualityScores.reviewId],
      references: [reviews.id],
    }),
  }),
);

export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  product: one(products, {
    fields: [mediaAssets.productId],
    references: [products.id],
  }),
}));

export const affiliateClicksRelations = relations(
  affiliateClicks,
  ({ one }) => ({
    product: one(products, {
      fields: [affiliateClicks.productId],
      references: [products.id],
    }),
    review: one(reviews, {
      fields: [affiliateClicks.reviewId],
      references: [reviews.id],
    }),
  }),
);

export const jobRunsRelations = relations(jobRuns, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [jobRuns.campaignId],
    references: [campaigns.id],
  }),
  logs: many(cronLogs),
}));

export const cronLogsRelations = relations(cronLogs, ({ one }) => ({
  jobRun: one(jobRuns, {
    fields: [cronLogs.jobRunId],
    references: [jobRuns.id],
  }),
}));
