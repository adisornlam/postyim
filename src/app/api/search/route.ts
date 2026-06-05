import { NextResponse } from "next/server";

import {
  normalizeSearchQuery,
  searchPublishedCategories,
  searchPublishedReviews,
  SEARCH_MIN_QUERY_LENGTH,
} from "@/lib/reviews/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = normalizeSearchQuery(searchParams.get("q") ?? "");
  const limit = Math.min(Number(searchParams.get("limit") ?? "6"), 20);

  if (query.length < SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json({
      query,
      reviews: [],
      categories: [],
    });
  }

  const [reviews, categories] = await Promise.all([
    searchPublishedReviews(query, limit),
    searchPublishedCategories(query, 4),
  ]);

  return NextResponse.json({
    query,
    reviews: reviews.map(({ review, product, author, category }) => ({
      slug: review.slug,
      title: review.title,
      metaDescription: review.metaDescription,
      rating: review.rating,
      productTitle: product.title,
      imageUrl: product.imageUrl,
      authorName: author?.name ?? null,
      category: category
        ? { name: category.name, slug: category.slug }
        : null,
    })),
    categories: categories.map(({ category, reviewCount }) => ({
      name: category.name,
      slug: category.slug,
      description: category.description,
      reviewCount,
    })),
  });
}
