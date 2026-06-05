import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/env";
import {
  getCategoriesWithPublishedReviews,
  getPublishedReviewSlugs,
} from "@/lib/reviews/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [reviews, categories] = await Promise.all([
    getPublishedReviewSlugs(),
    getCategoriesWithPublishedReviews(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${siteUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/disclosure`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const reviewPages: MetadataRoute.Sitemap = reviews.map((review) => ({
    url: `${siteUrl}/reviews/${review.slug}`,
    lastModified: review.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map(({ category }) => ({
    url: `${siteUrl}/reviews/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...reviewPages];
}
