import { HomePageView } from "@/components/home/home-page-view";
import {
  getCategoriesWithPublishedReviews,
  getFeaturedPublishedReviews,
} from "@/lib/reviews/queries";

export default async function HomePage() {
  const [featuredReviews, categories] = await Promise.all([
    getFeaturedPublishedReviews(6),
    getCategoriesWithPublishedReviews(),
  ]);

  return (
    <HomePageView featuredReviews={featuredReviews} categories={categories} />
  );
}
