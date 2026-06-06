"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductImage } from "@/components/reviews/product-image";
import type { EditorialImage } from "@/lib/reviews/editorial-images";

interface ReviewHeroGalleryProps {
  images: EditorialImage[];
  productTitle: string;
}

export function ReviewHeroGallery({
  images,
  productTitle,
}: ReviewHeroGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return null;
  }

  function scrollBy(direction: "left" | "right") {
    const node = scrollerRef.current;
    if (!node) {
      return;
    }

    const amount = direction === "left" ? -node.clientWidth * 0.85 : node.clientWidth * 0.85;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section aria-label={`${productTitle} photo gallery`} className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          In testing
        </p>
        {images.length > 1 ? (
          <div className="hidden gap-1 sm:flex">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground"
              aria-label="Previous photo"
              onClick={() => scrollBy("left")}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground"
              aria-label="Next photo"
              onClick={() => scrollBy("right")}
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="review-hero-gallery flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <figure
            key={`${image.url}-${index}`}
            className="review-hero-gallery-item min-w-[82%] shrink-0 snap-start overflow-hidden rounded-2xl border bg-card sm:min-w-0"
          >
            <ProductImage
              src={image.url}
              alt={image.alt}
              variant="product"
              width={1200}
              height={1200}
              fetchPriority={index === 0 ? "high" : undefined}
              loading={index === 0 ? "eager" : "lazy"}
            />
            {image.caption ? (
              <figcaption className="px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
