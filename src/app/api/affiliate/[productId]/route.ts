import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { affiliateClicks, products, reviews } from "@/db/schema";

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> },
) {
  const { productId } = await context.params;
  const { searchParams } = new URL(request.url);
  const reviewSlug = searchParams.get("review");

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let reviewId: string | undefined;

  if (reviewSlug) {
    const [review] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.slug, reviewSlug))
      .limit(1);

    reviewId = review?.id;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";

  await db.insert(affiliateClicks).values({
    productId: product.id,
    reviewId,
    ipHash: createHash("sha256").update(ip).digest("hex"),
    userAgent: request.headers.get("user-agent") ?? undefined,
    referrer: request.headers.get("referer") ?? undefined,
  });

  return NextResponse.redirect(product.affiliateLink, 302);
}
