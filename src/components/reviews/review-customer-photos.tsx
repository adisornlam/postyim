"use client";

import { ProductImage } from "@/components/reviews/product-image";
import type { EditorialImage } from "@/lib/reviews/editorial-images";

interface ReviewCustomerPhotosProps {
  images: EditorialImage[];
  amazonReviewUrl?: string | null;
}

function formatCustomerPhotoCaption(caption: string): string {
  return caption.replace(/^customer photo:\s*/i, "").trim();
}

export function ReviewCustomerPhotos({
  images,
  amazonReviewUrl,
}: ReviewCustomerPhotosProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="customer-photos-heading"
      className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5"
    >
      <div className="space-y-1">
        <h2
          id="customer-photos-heading"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight sm:text-2xl"
        >
          How it looks in real home offices
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Photos from Amazon verified purchasers. Setup and lighting may vary.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {images.map((image, index) => (
          <figure
            key={`${image.url}-${index}`}
            className="overflow-hidden rounded-xl border bg-[#f5f5f5]"
          >
            <ProductImage
              src={image.url}
              alt={image.alt}
              variant="product"
              loading="lazy"
            />
            {image.caption ? (
              <figcaption className="border-t px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                {formatCustomerPhotoCaption(image.caption)}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {amazonReviewUrl ? (
        <p className="text-xs text-muted-foreground">
          <a
            href={amazonReviewUrl}
            className="font-medium text-[var(--review-accent)] hover:underline"
            rel="nofollow sponsored noopener"
            target="_blank"
          >
            See more customer photos on Amazon
          </a>
        </p>
      ) : null}
    </section>
  );
}
