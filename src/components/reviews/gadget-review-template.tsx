import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ReviewJsonLd } from "@/components/seo/review-json-ld";
import { SiteFooter, SiteHeader } from "@/components/site/site-chrome";
import { ReviewAtAGlanceBar } from "@/components/reviews/review-at-a-glance-bar";
import { ReviewAuthorCard } from "@/components/reviews/review-author-card";
import { ReviewBreadcrumb } from "@/components/reviews/review-breadcrumb";
import { ReviewHeroGallery } from "@/components/reviews/review-hero-gallery";
import { ReviewMarkdownContent } from "@/components/reviews/review-markdown-content";
import { ReviewProsConsPanel } from "@/components/reviews/review-pros-cons-panel";
import { ReviewSpecChips } from "@/components/reviews/review-spec-chips";
import { ReviewStickyCta } from "@/components/reviews/review-sticky-cta";
import { ReviewTableOfContents } from "@/components/reviews/review-table-of-contents";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_DISCLOSURE, AFFILIATE_DISCLOSURE_MARKERS } from "@/lib/ai/constants";
import {
  getSectionEditorialImages,
  resolveHeroGalleryImages,
} from "@/lib/reviews/review-images";
import { enrichReviewContent } from "@/lib/reviews/enrich-review-content";
import {
  extractMarkdownHeadings,
  formatReviewDate,
} from "@/lib/reviews/markdown-utils";
import { isPriceStale } from "@/lib/reviews/queries";

interface GadgetReviewTemplateProps {
  review: {
    title: string;
    slug: string;
    content: string;
    metaDescription?: string | null;
    rating?: string | null;
    pros: unknown;
    cons: unknown;
    publishedAt?: Date | null;
    updatedAt?: Date | null;
  };
  product: {
    id: string;
    title: string;
    externalId?: string | null;
    description?: string | null;
    price?: string | null;
    currency: string;
    imageUrl?: string | null;
    affiliateLink: string;
    lastSyncedAt?: Date | null;
    specs?: unknown;
  };
  author?: {
    name: string;
    title?: string | null;
    slug: string;
    bio?: string | null;
  } | null;
  mediaAssets?: Array<{
    url: string;
    altText?: string | null;
    sortOrder?: number;
  }>;
  related?: Array<{
    review: { slug: string; title: string; rating?: string | null };
    product: { title: string; imageUrl?: string | null };
  }>;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function contentHasDisclosure(content: string): boolean {
  const normalized = content.toLowerCase();
  return AFFILIATE_DISCLOSURE_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

function resolveReviewImages(
  product: GadgetReviewTemplateProps["product"],
  mediaAssets: GadgetReviewTemplateProps["mediaAssets"],
) {
  return resolveHeroGalleryImages({
    productTitle: product.title,
    externalId: product.externalId,
    productImageUrl: product.imageUrl,
    mediaAssets,
  });
}

export function GadgetReviewTemplate({
  review,
  product,
  author,
  mediaAssets = [],
  related = [],
}: GadgetReviewTemplateProps) {
  const pros = asStringArray(review.pros);
  const cons = asStringArray(review.cons);
  const specs = (product.specs ?? {}) as Record<string, unknown>;
  const stalePrice = isPriceStale(product.lastSyncedAt);
  const rating = review.rating ? Number.parseFloat(review.rating) : null;
  const publishedLabel = formatReviewDate(review.publishedAt);
  const priceLabel =
    stalePrice || !product.price
      ? "See current price on Amazon"
      : `$${product.price} ${product.currency}`;

  const heroImages = resolveReviewImages(product, mediaAssets);
  const sectionImages = getSectionEditorialImages({
    externalId: product.externalId,
    title: product.title,
  });
  const enrichedContent = enrichReviewContent(review.content, sectionImages);
  const headings = extractMarkdownHeadings(enrichedContent);
  const showStandaloneDisclosure = !contentHasDisclosure(review.content);

  return (
    <div className="review-template min-h-screen bg-[var(--review-bg)]">
      <ReviewJsonLd review={review} product={product} author={author} />

      <SiteHeader variant="review" />

      <main className="pb-24 lg:pb-12">
        <div className="review-hero-bg border-b">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <ReviewBreadcrumb reviewTitle={review.title} />

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[var(--review-accent)]/20 bg-[var(--review-accent)]/10 text-[var(--review-accent)] hover:bg-[var(--review-accent)]/10">
                  Gadget Review
                </Badge>
                {publishedLabel ? (
                  <time
                    dateTime={review.publishedAt?.toISOString()}
                    className="text-xs text-muted-foreground"
                  >
                    Updated {publishedLabel}
                  </time>
                ) : null}
              </div>

              <header className="max-w-4xl space-y-3">
                <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
                  {review.title}
                </h1>

                {review.metaDescription ? (
                  <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {review.metaDescription}
                  </p>
                ) : null}

                {author ? (
                  <p className="text-sm text-muted-foreground">
                    Tested by{" "}
                    <Link
                      href={`/authors/${author.slug}`}
                      className="font-medium text-foreground hover:text-[var(--review-accent)]"
                      rel="author"
                    >
                      {author.name}
                    </Link>
                    {author.title ? ` · ${author.title}` : ""}
                  </p>
                ) : null}
              </header>

              <ReviewSpecChips specs={specs} />
            </div>

            <ReviewHeroGallery images={heroImages} productTitle={product.title} />

            <ReviewAtAGlanceBar
              productTitle={product.title}
              productId={product.id}
              priceLabel={priceLabel}
              rating={rating}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="space-y-8">
            {pros.length > 0 || cons.length > 0 ? (
              <ReviewProsConsPanel pros={pros} cons={cons} />
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <ReviewTableOfContents headings={headings} />
              </aside>

              <article className="min-w-0 space-y-8">
                <ReviewMarkdownContent content={enrichedContent} />

                {author ? <ReviewAuthorCard author={author} /> : null}

                {showStandaloneDisclosure ? (
                  <section
                    aria-label="Affiliate disclosure"
                    className="rounded-2xl border border-dashed bg-muted/20 p-5 text-sm leading-relaxed text-muted-foreground"
                  >
                    {DEFAULT_DISCLOSURE}
                  </section>
                ) : null}
              </article>
            </div>

            {related.length > 0 ? (
              <section aria-labelledby="related-heading" className="space-y-5 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <h2
                    id="related-heading"
                    className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight"
                  >
                    More to explore
                  </h2>
                  <Link
                    href="/reviews"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[var(--review-accent)] hover:underline"
                  >
                    All reviews
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map(({ review: relatedReview, product: relatedProduct }) => (
                    <Link
                      key={relatedReview.slug}
                      href={`/reviews/${relatedReview.slug}`}
                      className="group review-related-card overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {relatedProduct.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={relatedProduct.imageUrl}
                          alt=""
                          className="aspect-[16/10] w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="space-y-1 p-4">
                        <p className="font-medium leading-snug group-hover:text-[var(--review-accent)]">
                          {relatedReview.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {relatedProduct.title}
                          {relatedReview.rating
                            ? ` · ${relatedReview.rating}/5`
                            : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>

      <ReviewStickyCta
        productId={product.id}
        productTitle={product.title}
        priceLabel={priceLabel}
      />

      <SiteFooter variant="review" />
    </div>
  );
}
