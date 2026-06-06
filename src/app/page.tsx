import type { Metadata } from "next";

import { HomePageView } from "@/components/home/home-page-view";
import {
  getCategoriesWithPublishedReviews,
  getFeaturedPublishedReviews,
} from "@/lib/reviews/queries";

export const metadata: Metadata = {
  description:
    "The best gear, tested and reviewed. Clear picks, real pros and cons, and prices you can act on.",
};

export const revalidate = 300;

export default async function HomePage() {
  const [featuredReviews, categories] = await Promise.all([
    getFeaturedPublishedReviews(6),
    getCategoriesWithPublishedReviews(),
  ]);

  return (
    <HomePageView featuredReviews={featuredReviews} categories={categories} />
  );
}
