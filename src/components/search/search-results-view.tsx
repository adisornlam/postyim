import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HomeReviewCard } from "@/components/home/home-review-card";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { SiteSearch } from "@/components/site/site-search";

interface SearchResultsViewProps {
  query: string;
  reviews: Array<{
    review: {
      id: string;
      title: string;
      slug: string;
      rating?: string | null;
    };
    product: {
      title: string;
      imageUrl?: string | null;
    };
    author?: {
      name: string;
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

export function SearchResultsView({
  query,
  reviews,
  categories,
}: SearchResultsViewProps) {
  const hasQuery = query.length >= 2;

  return (
    <div className="min-h-screen bg-[var(--review-bg)]">
      <SiteHeader variant="review" />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-8">
          <header className="space-y-5">
            <div className="space-y-2">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
                Search
              </h1>
              <p className="text-muted-foreground">
                Find reviews by product, category, or topic.
              </p>
            </div>

            <SiteSearch
              key={query}
              variant="page"
              autoFocus={!hasQuery}
              defaultQuery={query}
              className="max-w-2xl"
            />
          </header>

          {!hasQuery ? (
            <section className="rounded-2xl border border-dashed bg-card/50 p-8 text-center sm:p-12">
              <p className="text-muted-foreground">
                Type at least 2 characters to search published reviews.
              </p>
            </section>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {reviews.length === 0 && categories.length === 0
                  ? `No results for “${query}”.`
                  : `${reviews.length} review${reviews.length === 1 ? "" : "s"} found for “${query}”.`}
              </p>

              {categories.length > 0 ? (
                <section aria-labelledby="search-categories-heading" className="space-y-4">
                  <h2
                    id="search-categories-heading"
                    className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
                  >
                    Matching categories
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {categories.map(({ category, reviewCount }) => (
                      <li key={category.slug}>
                        <Link
                          href={`/reviews/category/${category.slug}`}
                          className="flex h-full flex-col rounded-2xl border bg-card p-5 transition-all hover:border-[var(--review-accent)]/40 hover:shadow-sm"
                        >
                          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
                            {category.name}
                          </p>
                          {category.description ? (
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                              {category.description}
                            </p>
                          ) : null}
                          <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            {reviewCount}{" "}
                            {reviewCount === 1 ? "review" : "reviews"}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {reviews.length > 0 ? (
                <section aria-labelledby="search-reviews-heading" className="space-y-4">
                  <h2
                    id="search-reviews-heading"
                    className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
                  >
                    Reviews
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((item) => (
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

              {reviews.length === 0 && categories.length === 0 ? (
                <section className="rounded-2xl border border-dashed bg-card/50 p-8 text-center sm:p-12">
                  <p className="font-medium">Nothing matched that search.</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try a product name, brand, or category like home office or
                    desk lamp.
                  </p>
                  <Link
                    href="/reviews"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--review-accent)] hover:underline"
                  >
                    Browse all reviews
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>

      <SiteFooter variant="review" />
    </div>
  );
}
