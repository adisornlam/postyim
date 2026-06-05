import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReviewsIndexView } from "@/components/reviews/reviews-index-view";
import { getSiteName, getSiteUrl } from "@/lib/env";
import {
  getCategoryBySlug,
  getPublishedReviewsByCategorySlug,
} from "@/lib/reviews/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found" };
  }

  const siteName = getSiteName();
  const url = `${getSiteUrl()}/reviews/category/${slug}`;

  return {
    title: `${category.name} Reviews`,
    description:
      category.description ??
      `Product reviews and buying guides for ${category.name.toLowerCase()}.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${category.name} Reviews | ${siteName}`,
      description:
        category.description ??
        `Product reviews and buying guides for ${category.name.toLowerCase()}.`,
      url,
      siteName,
    },
  };
}

export default async function CategoryReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const reviews = await getPublishedReviewsByCategorySlug(slug);

  return (
    <ReviewsIndexView
      reviews={reviews}
      heading={`${category.name} reviews`}
      description={
        category.description ??
        `Our latest reviews and recommendations for ${category.name.toLowerCase()}.`
      }
      breadcrumb={{ label: category.name, href: `/reviews/category/${slug}` }}
    />
  );
}
