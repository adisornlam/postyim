import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HomeReviewCard } from "@/components/home/home-review-card";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";

interface ReviewsIndexViewProps {
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
  heading: string;
  description: string;
  breadcrumb?: {
    label: string;
    href: string;
  } | null;
}

export function ReviewsIndexView({
  reviews,
  heading,
  description,
  breadcrumb = null,
}: ReviewsIndexViewProps) {
  return (
    <div className="min-h-screen bg-[var(--review-bg)]">
      <SiteHeader variant="review" />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-8">
          <header className="space-y-3">
            {breadcrumb ? (
              <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/" className="hover:text-foreground">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <Link href="/reviews" className="hover:text-foreground">
                      Reviews
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <span className="text-foreground">{breadcrumb.label}</span>
                  </li>
                </ol>
              </nav>
            ) : null}

            <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight sm:text-4xl">
              {heading}
            </h1>
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          </header>

          {reviews.length === 0 ? (
            <section className="rounded-2xl border border-dashed bg-card/50 p-8 text-center sm:p-12">
              <p className="text-muted-foreground">No published reviews yet.</p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--review-accent)] hover:underline"
              >
                Back to home
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </section>
          ) : (
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
          )}
        </div>
      </main>

      <SiteFooter variant="review" />
    </div>
  );
}
