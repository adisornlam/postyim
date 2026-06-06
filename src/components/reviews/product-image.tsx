import { cn } from "@/lib/utils";
import { isAmazonProductImageUrl } from "@/lib/products/amazon-image-url";

export type ProductImageVariant = "product" | "lifestyle" | "auto";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  variant?: ProductImageVariant;
  fetchPriority?: "high" | "low" | "auto";
  loading?: "eager" | "lazy";
  width?: number;
  height?: number;
}

function resolveVariant(
  src: string,
  variant: ProductImageVariant,
): "product" | "lifestyle" {
  if (variant === "auto") {
    return isAmazonProductImageUrl(src) ? "product" : "lifestyle";
  }

  return variant;
}

export function ProductImage({
  src,
  alt,
  className,
  variant = "auto",
  fetchPriority,
  loading = "lazy",
  width,
  height,
}: ProductImageProps) {
  const resolved = resolveVariant(src, variant);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      fetchPriority={fetchPriority}
      loading={loading}
      className={cn(
        resolved === "product"
          ? "aspect-square w-full bg-[#f5f5f5] object-contain p-3 sm:p-4"
          : "aspect-[16/10] w-full object-cover",
        className,
      )}
    />
  );
}
