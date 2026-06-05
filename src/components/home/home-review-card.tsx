import Link from "next/link";
import { Star } from "lucide-react";

interface HomeReviewCardProps {
  review: {
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
  } | null;
}

export function HomeReviewCard({
  review,
  product,
  author,
  category,
}: HomeReviewCardProps) {
  const rating = review.rating ? Number.parseFloat(review.rating) : null;

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="home-review-card group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
        {rating ? (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm">
            <Star
              className="size-3 fill-[var(--review-accent)] text-[var(--review-accent)]"
              aria-hidden
            />
            {rating.toFixed(1)}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        {category ? (
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--review-accent)]">
            {category.name}
          </p>
        ) : null}
        <h3 className="line-clamp-2 font-[family-name:var(--font-display)] text-base font-semibold leading-snug tracking-tight group-hover:text-[var(--review-accent)] sm:text-lg">
          {review.title}
        </h3>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {product.title}
        </p>
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {author?.name ? `By ${author.name}` : "Postyim editorial"}
        </p>
      </div>
    </Link>
  );
}
