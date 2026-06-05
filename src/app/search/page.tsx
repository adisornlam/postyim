import type { Metadata } from "next";

import { SearchResultsView } from "@/components/search/search-results-view";
import {
  normalizeSearchQuery,
  searchPublishedCategories,
  searchPublishedReviews,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/lib/reviews/search";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = normalizeSearchQuery(q ?? "");

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return {
      title: "Search",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `Search: ${query}`,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = normalizeSearchQuery(q ?? "");

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return (
      <SearchResultsView query={query} reviews={[]} categories={[]} />
    );
  }

  const [reviews, categories] = await Promise.all([
    searchPublishedReviews(query, 24),
    searchPublishedCategories(query, 6),
  ]);

  return (
    <SearchResultsView
      query={query}
      reviews={reviews}
      categories={categories}
    />
  );
}
