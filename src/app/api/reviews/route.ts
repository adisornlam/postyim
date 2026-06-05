import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  authors,
  contentQualityScores,
  keywords,
  products,
  reviews,
} from "@/db/schema";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);

  const rows = await db
    .select({
      id: reviews.id,
      slug: reviews.slug,
      title: reviews.title,
      status: reviews.status,
      metaDescription: reviews.metaDescription,
      rating: reviews.rating,
      wordCount: reviews.wordCount,
      pros: reviews.pros,
      cons: reviews.cons,
      publishedAt: reviews.publishedAt,
      updatedAt: reviews.updatedAt,
      product: {
        id: products.id,
        title: products.title,
        externalId: products.externalId,
        imageUrl: products.imageUrl,
      },
      author: {
        name: authors.name,
        slug: authors.slug,
      },
      keyword: keywords.keyword,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .leftJoin(authors, eq(authors.id, reviews.authorId))
    .leftJoin(keywords, eq(keywords.id, reviews.keywordId))
    .where(
      status
        ? and(eq(reviews.status, status as (typeof reviews.$inferSelect)["status"]))
        : undefined,
    )
    .orderBy(desc(reviews.updatedAt))
    .limit(Number.isFinite(limit) ? limit : 20);

  return NextResponse.json({ reviews: rows, count: rows.length });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { reviewId?: string };
  const reviewId = body.reviewId;

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  const [score] = await db
    .select()
    .from(contentQualityScores)
    .where(eq(contentQualityScores.reviewId, reviewId))
    .orderBy(desc(contentQualityScores.evaluatedAt))
    .limit(1);

  if (!score) {
    return NextResponse.json({ error: "Quality score not found" }, { status: 404 });
  }

  return NextResponse.json({ qualityScore: score });
}
