import { ProductImage } from "@/components/reviews/product-image";
import { isAmazonProductImageUrl } from "@/lib/products/amazon-image-url";

interface ReviewFigureProps {
  src: string;
  alt: string;
  caption?: string;
}

export function ReviewFigure({ src, alt, caption }: ReviewFigureProps) {
  const label = caption ?? alt;
  const figureId = label
    ? `figure-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`
    : undefined;
  const variant = isAmazonProductImageUrl(src) ? "product" : "lifestyle";

  return (
    <figure
      id={figureId}
      className="review-figure my-8 overflow-hidden rounded-2xl border bg-card"
    >
      <ProductImage src={src} alt={alt} variant={variant} />
      {label ? (
        <figcaption className="border-t px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
}
