import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { Badge } from "@/components/ui/badge";
import { getSiteName } from "@/lib/env";
import {
  getAuthorBySlug,
  getPublishedReviewsByAuthorSlug,
} from "@/lib/reviews/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) {
    return { title: "Author not found" };
  }

  return {
    title: `${author.name} | ${getSiteName()}`,
    description:
      author.bio ??
      `${author.name} writes hands-on product reviews for ${getSiteName()}.`,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author || !author.isActive) {
    notFound();
  }

  const reviews = await getPublishedReviewsByAuthorSlug(slug);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <section className="mb-10 flex flex-col gap-6 rounded-3xl border bg-card p-8 sm:flex-row">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-hidden
          >
            <UserRound className="size-8" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm uppercase tracking-[0.14em] text-muted-foreground">
                Author
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {author.name}
              </h1>
              {author.title ? (
                <p className="text-muted-foreground">{author.title}</p>
              ) : null}
            </div>
            {author.bio ? (
              <p className="max-w-2xl leading-relaxed text-muted-foreground">
                {author.bio}
              </p>
            ) : null}
            {Array.isArray(author.credentials) && author.credentials.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {author.credentials
                  .filter((item): item is string => typeof item === "string")
                  .map((credential) => (
                    <Badge key={credential} variant="secondary">
                      {credential}
                    </Badge>
                  ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Published reviews
            </h2>
            <p className="text-muted-foreground">
              {reviews.length} reviews by {author.name}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map(({ review, product, category }) => (
              <Link
                key={review.id}
                href={`/reviews/${review.slug}`}
                className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm text-muted-foreground">
                  {category?.name ?? "Review"}
                </p>
                <h3 className="mt-2 font-semibold leading-snug">{review.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {product.title}
                  {review.rating ? ` · ${review.rating}/5` : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
