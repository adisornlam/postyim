import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatReviewDate } from "@/lib/reviews/markdown-utils";

interface HomeEditorsPickProps {
  review: {
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
}

export function HomeEditorsPick({
  review,
  product,
  author,
  category,
}: HomeEditorsPickProps) {
  const publishedLabel = formatReviewDate(review.publishedAt);
  const rating = review.rating ? Number.parseFloat(review.rating) : null;

  return (
    <section
      aria-labelledby="editors-pick-heading"
      className="home-editors-pick overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="relative min-h-[220px] bg-muted/30 sm:min-h-[280px] lg:min-h-[360px]">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.title}
              className="absolute inset-0 size-full object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Product image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/5" />
          {rating ? (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur-sm">
              <Star
                className="size-4 fill-[var(--review-accent)] text-[var(--review-accent)]"
                aria-hidden
              />
              {rating.toFixed(1)}
              <span className="font-normal text-muted-foreground">/ 5</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
          <div className="space-y-3">
            <p
              id="editors-pick-heading"
              className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--review-accent)]"
            >
              Editor&apos;s pick
            </p>
            {category ? (
              <Link
                href={`/reviews/category/${category.slug}`}
                className="text-sm text-muted-foreground hover:text-[var(--review-accent)]"
              >
                {category.name}
              </Link>
            ) : null}
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight tracking-tight text-balance sm:text-3xl">
              {review.title}
            </h2>
            {review.metaDescription ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {review.metaDescription}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {author ? (
              <span>
                By{" "}
                <span className="font-medium text-foreground">{author.name}</span>
                {author.title ? ` · ${author.title}` : ""}
              </span>
            ) : null}
            {publishedLabel ? (
              <>
                {author ? <span aria-hidden>·</span> : null}
                <time dateTime={review.publishedAt?.toISOString()}>
                  {publishedLabel}
                </time>
              </>
            ) : null}
            {product.price ? (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-foreground">
                  From ${product.price} {product.currency}
                </span>
              </>
            ) : null}
          </div>

          <Button
            size="lg"
            className="w-fit gap-2 bg-[var(--review-accent)] text-[var(--review-accent-foreground)] hover:bg-[var(--review-accent)]/90"
            render={<Link href={`/reviews/${review.slug}`} />}
          >
            Read full review
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </section>
  );
}
