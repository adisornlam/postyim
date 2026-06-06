import { getSiteName, getSiteUrl } from "@/lib/env";

interface ReviewJsonLdProps {
  review: {
    title: string;
    content: string;
    rating?: string | null;
    slug: string;
    publishedAt?: Date | null;
    updatedAt?: Date | null;
    metaDescription?: string | null;
  };
  product: {
    title: string;
    description?: string | null;
    price?: string | null;
    currency: string;
    imageUrl?: string | null;
    affiliateLink: string;
    externalId?: string | null;
  };
  author?: {
    name: string;
    slug?: string;
  } | null;
}

export function ReviewJsonLd({
  review,
  product,
  author,
}: ReviewJsonLdProps) {
  const siteUrl = getSiteUrl();
  const siteName = getSiteName();
  const reviewUrl = `${siteUrl}/reviews/${review.slug}`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${reviewUrl}#webpage`,
        name: review.title,
        description: review.metaDescription ?? review.content.slice(0, 160),
        url: reviewUrl,
        datePublished: review.publishedAt?.toISOString(),
        dateModified: (review.updatedAt ?? review.publishedAt)?.toISOString(),
        isPartOf: {
          "@type": "WebSite",
          name: siteName,
          url: siteUrl,
        },
        breadcrumb: {
          "@id": `${reviewUrl}#breadcrumb`,
        },
        mainEntity: {
          "@id": `${reviewUrl}#review`,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${reviewUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: siteName,
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Reviews",
            item: `${siteUrl}/reviews`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: review.title,
            item: reviewUrl,
          },
        ],
      },
      {
        "@type": "Product",
        "@id": `${reviewUrl}#product`,
        name: product.title,
        description: product.description ?? review.content.slice(0, 300),
        image: product.imageUrl ?? undefined,
        url: reviewUrl,
        sku: product.externalId ?? undefined,
        mpn: product.externalId ?? undefined,
        offers: product.price
          ? {
              "@type": "Offer",
              price: product.price,
              priceCurrency: product.currency,
              url: product.affiliateLink,
              availability: "https://schema.org/InStock",
            }
          : undefined,
      },
      {
        "@type": "Review",
        "@id": `${reviewUrl}#review`,
        itemReviewed: {
          "@id": `${reviewUrl}#product`,
        },
        name: review.title,
        reviewBody: review.content.slice(0, 5000),
        author: {
          "@type": "Person",
          name: author?.name ?? siteName,
          url: author?.slug ? `${siteUrl}/authors/${author.slug}` : `${siteUrl}/about`,
        },
        reviewRating: review.rating
          ? {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: "5",
              worstRating: "1",
            }
          : undefined,
        datePublished: review.publishedAt?.toISOString(),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
