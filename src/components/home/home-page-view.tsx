import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HomeCategoryNav } from "@/components/home/home-category-nav";
import { HomeEditorsPick } from "@/components/home/home-editors-pick";
import { HomeHero } from "@/components/home/home-hero";
import { HomeReviewCard } from "@/components/home/home-review-card";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

interface HomePageViewProps {
  featuredReviews: Array<{
    review: {
      id: string;
      title: string;
      slug: string;
      metaDescription?: string | null;
      rating?: string | null;
      publishedAt?: Date | null;
    };
    product: {
      title: string;
      imageUrl?: string | null;
      price?: string | null;
      currency: string;
    };
    author?: {
      name: string;
      title?: string | null;
    } | null;
    category?: {
      name: string;
      slug: string;
    } | null;
  }>;
  categories: Array<{
    category: {
      name: string;
      slug: string;
      description?: string | null;
    };
    reviewCount: number;
  }>;
}

export function HomePageView({
  featuredReviews,
  categories,
}: HomePageViewProps) {
  const [topPick, ...moreReviews] = featuredReviews;

  return (
    <div className="home-page min-h-screen bg-[var(--review-bg)]">
      <SiteHeader variant="review" />

      <main>
        <div className="home-hero-bg border-b">
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
            <HomeHero />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:space-y-14">
          {topPick ? (
            <HomeEditorsPick
              review={topPick.review}
              product={topPick.product}
              author={topPick.author}
              category={topPick.category}
            />
          ) : (
            <section className="rounded-2xl border border-dashed bg-card/50 p-8 text-center sm:p-12">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
                Reviews coming soon
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                New buying guides and product reviews will appear here as they
                are published.
              </p>
            </section>
          )}

          {categories.length > 0 ? (
            <HomeCategoryNav categories={categories} />
          ) : null}

          {moreReviews.length > 0 ? (
            <section aria-labelledby="latest-reviews-heading" className="space-y-6">
              <div className="flex items-end justify-between gap-4">
                <h2
                  id="latest-reviews-heading"
                  className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight"
                >
                  Latest reviews
                </h2>
                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--review-accent)] hover:underline"
                >
                  View all
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {moreReviews.map((item) => (
                  <HomeReviewCard
                    key={item.review.id}
                    review={item.review}
                    product={item.product}
                    author={item.author}
                    category={item.category}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>

      <SiteFooter variant="review" />
    </div>
  );
}
