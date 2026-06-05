import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  authors,
  categories,
  keywords,
  products,
  reviews,
} from "@/db/schema";

export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_QUERY_LENGTH = 100;

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().slice(0, SEARCH_MAX_QUERY_LENGTH);
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function searchPublishedReviews(query: string, limit = 12) {
  const q = normalizeSearchQuery(query);

  if (q.length < SEARCH_MIN_QUERY_LENGTH) {
    return [];
  }

  const likePattern = `%${escapeLikePattern(q)}%`;
  const tsQuery = sql`websearch_to_tsquery('english', ${q})`;

  return db
    .select({
      review: reviews,
      product: products,
      author: authors,
      category: categories,
      rank: sql<number>`ts_rank(${reviews.searchVector}, ${tsQuery})`.as("rank"),
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .where(
      and(
        eq(reviews.status, "published"),
        sql`(
          ${reviews.searchVector} @@ ${tsQuery}
          OR ${reviews.title} ILIKE ${likePattern}
          OR ${reviews.metaDescription} ILIKE ${likePattern}
          OR ${products.title} ILIKE ${likePattern}
          OR ${categories.name} ILIKE ${likePattern}
          OR ${keywords.keyword} ILIKE ${likePattern}
        )`,
      ),
    )
    .orderBy(desc(sql`ts_rank(${reviews.searchVector}, ${tsQuery})`), desc(reviews.publishedAt))
    .limit(limit);
}

export async function searchPublishedCategories(query: string, limit = 4) {
  const q = normalizeSearchQuery(query);

  if (q.length < SEARCH_MIN_QUERY_LENGTH) {
    return [];
  }

  const likePattern = `%${escapeLikePattern(q)}%`;
  const tsQuery = sql`websearch_to_tsquery('english', ${q})`;

  return db
    .select({
      category: categories,
      reviewCount: sql<number>`count(distinct ${reviews.id})::int`,
    })
    .from(categories)
    .innerJoin(products, eq(products.categoryId, categories.id))
    .innerJoin(
      reviews,
      and(eq(reviews.productId, products.id), eq(reviews.status, "published")),
    )
    .where(
      sql`(
        ${categories.searchVector} @@ ${tsQuery}
        OR ${categories.name} ILIKE ${likePattern}
        OR ${categories.description} ILIKE ${likePattern}
      )`,
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`count(distinct ${reviews.id})`))
    .limit(limit);
}
