import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface HomeCategoryNavProps {
  categories: Array<{
    category: {
      name: string;
      slug: string;
      description?: string | null;
    };
    reviewCount: number;
  }>;
}

export function HomeCategoryNav({ categories }: HomeCategoryNavProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="categories-heading" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="categories-heading"
            className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight"
          >
            Browse by category
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated guides for the gear you use every day.
          </p>
        </div>
        <Link
          href="/reviews"
          className="hidden items-center gap-1 text-sm font-medium text-[var(--review-accent)] hover:underline sm:inline-flex"
        >
          All reviews
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <ul className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {categories.map(({ category, reviewCount }) => (
          <li key={category.slug} className="min-w-[240px] shrink-0 sm:min-w-0">
            <Link
              href={`/reviews/category/${category.slug}`}
              className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all hover:border-[var(--review-accent)]/40 hover:shadow-sm"
            >
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight group-hover:text-[var(--review-accent)]">
                {category.name}
              </p>
              {category.description ? (
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              ) : null}
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
