import Link from "next/link";
import { UserRound } from "lucide-react";

interface ReviewAuthorCardProps {
  author: {
    name: string;
    title?: string | null;
    slug: string;
    bio?: string | null;
  };
}

export function ReviewAuthorCard({ author }: ReviewAuthorCardProps) {
  return (
    <aside
      aria-labelledby="author-heading"
      className="review-author-card rounded-2xl border bg-card p-5 sm:p-6"
    >
      <h2
        id="author-heading"
        className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        Reviewed by
      </h2>
      <div className="flex gap-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--review-accent)]/10 text-[var(--review-accent)]"
          aria-hidden
        >
          <UserRound className="size-5" />
        </div>
        <div className="space-y-2">
          <Link
            href={`/authors/${author.slug}`}
            className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight hover:text-[var(--review-accent)]"
            rel="author"
          >
            {author.name}
          </Link>
          {author.title ? (
            <p className="text-sm text-muted-foreground">{author.title}</p>
          ) : null}
          {author.bio ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {author.bio}
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
