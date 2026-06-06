import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ReviewPageView } from "@/components/reviews/review-page-view";
import { getSiteName, getSiteUrl } from "@/lib/env";
import {
  getMediaAssetsForProduct,
  getRelatedPublishedReviews,
  resolvePublishedReviewRoute,
} from "@/lib/reviews/queries";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const route = await resolvePublishedReviewRoute(slug);

  if (route.kind === "not-found") {
    return { title: "Review not found" };
  }

  if (route.kind === "redirect") {
    return {
      alternates: {
        canonical: `${getSiteUrl()}/reviews/${route.slug}`,
      },
    };
  }

  const data = route.data;
  const canonicalSlug = route.slug;
  const siteName = getSiteName();
  const url = `${getSiteUrl()}/reviews/${canonicalSlug}`;

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
      images: data.product.imageUrl ? [{ url: data.product.imageUrl }] : undefined,
    },
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = await resolvePublishedReviewRoute(slug);

  if (route.kind === "redirect") {
    redirect(`/reviews/${route.slug}`);
  }

  if (route.kind === "not-found") {
    notFound();
  }

  const data = route.data;

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
