import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReviewPageView } from "@/components/reviews/review-page-view";
import { getSiteName, getSiteUrl } from "@/lib/env";
import {
  getMediaAssetsForProduct,
  getPublishedReviewBySlug,
  getRelatedPublishedReviews,
} from "@/lib/reviews/queries";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublishedReviewBySlug(slug);

  if (!data) {
    return { title: "Review not found" };
  }

  const siteName = getSiteName();
  const url = `${getSiteUrl()}/reviews/${slug}`;

  const publishedTime = data.review.publishedAt?.toISOString();
  const modifiedTime = (data.review.updatedAt ?? data.review.publishedAt)?.toISOString();

  return {
    title: data.review.title,
    description: data.review.metaDescription ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: data.review.title,
      description: data.review.metaDescription ?? undefined,
      url,
      siteName,
      publishedTime,
      modifiedTime,
      authors: data.author?.name ? [data.author.name] : undefined,
      images: data.product.imageUrl ? [{ url: data.product.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: data.review.title,
      description: data.review.metaDescription ?? undefined,
      images: data.product.imageUrl ? [data.product.imageUrl] : undefined,
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublishedReviewBySlug(slug);

  if (!data) {
    notFound();
  }

  const related = await getRelatedPublishedReviews({
    excludeReviewId: data.review.id,
    categoryId: data.product.categoryId,
  });

  const mediaAssets = await getMediaAssetsForProduct(data.product.id);

  return (
    <ReviewPageView
      review={data.review}
      product={data.product}
      author={data.author}
      mediaAssets={mediaAssets}
      related={related}
    />
  );
}
