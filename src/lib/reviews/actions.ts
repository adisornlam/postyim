import { eq } from "drizzle-orm";

import { db } from "@/db";
import { reviews } from "@/db/schema";
import { generateReviewForProduct } from "@/lib/jobs/content-generation";
import { assertReviewPublishable } from "@/lib/ai/review-qc";
import { getSiteUrl } from "@/lib/env";

export async function approveReview(reviewId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  if (review.status !== "pending_review") {
    throw new Error(`Review must be pending_review to approve (current: ${review.status})`);
  }

  const [updated] = await db
    .update(reviews)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .returning();

  return updated;
}

export async function publishReview(reviewId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  if (!["pending_review", "approved", "scheduled"].includes(review.status)) {
    throw new Error(
      `Review must be pending_review or approved before publishing (current: ${review.status})`,
    );
  }

  await assertReviewPublishable(reviewId);

  const now = new Date();
  const canonicalUrl = `${getSiteUrl()}/reviews/${review.slug}`;

  const [updated] = await db
    .update(reviews)
    .set({
      status: "published",
      publishedAt: now,
      canonicalUrl,
      updatedAt: now,
    })
    .where(eq(reviews.id, reviewId))
    .returning();

  return updated;
}

export async function rejectReview(reviewId: string) {
  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  if (!["pending_review", "approved"].includes(review.status)) {
    throw new Error(`Review cannot be rejected from status "${review.status}"`);
  }

  const [updated] = await db
    .update(reviews)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(reviews.id, reviewId))
    .returning();

  return updated;
}

export async function approveAndPublishReview(reviewId: string) {
  await approveReview(reviewId);
  return publishReview(reviewId);
}

export async function regenerateReviewById(reviewId: string) {
  const [review] = await db
    .select({ productId: reviews.productId })
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!review) {
    throw new Error("Review not found");
  }

  return generateReviewForProduct(review.productId);
}
