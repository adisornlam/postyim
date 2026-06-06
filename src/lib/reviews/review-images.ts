import {
  resolveCoverImage,
  selectHeroImages,
  selectSectionImages,
  type ProductImageRole,
} from "@/lib/products/image-roles";
import {
  isAmazonProductImageUrl,
  normalizeAmazonImageUrl,
} from "@/lib/products/amazon-image-url";
import type { ProductResearchImage } from "@/lib/products/research-types";
import {
  getEditorialImagesForProduct,
  getHeroGalleryImages,
  type EditorialImage,
} from "@/lib/reviews/editorial-images";

export interface ReviewMediaAsset {
  url: string;
  altText?: string | null;
  sortOrder?: number;
}

function toEditorialImage(
  image: ProductResearchImage,
  productTitle: string,
): EditorialImage {
  return {
    url: image.url,
    alt: image.alt ?? `${productTitle} product photo`,
    caption: image.alt ?? `${productTitle} product photo`,
  };
}

function mediaAssetsToResearchImages(
  productTitle: string,
  productImageUrl?: string | null,
  mediaAssets: ReviewMediaAsset[] = [],
): ProductResearchImage[] {
  const urls = new Set<string>();
  const images: ProductResearchImage[] = [];

  const add = (url: string, alt: string, role?: ProductImageRole) => {
    const normalized = isAmazonProductImageUrl(url)
      ? normalizeAmazonImageUrl(url)
      : url;

    if (urls.has(normalized)) {
      return;
    }

    urls.add(normalized);
    images.push({
      url: normalized,
      alt,
      role: role ?? (isAmazonProductImageUrl(normalized) ? "product" : "lifestyle"),
    });
  };

  if (productImageUrl && isAmazonProductImageUrl(productImageUrl)) {
    add(productImageUrl, `${productTitle} product photo`, "hero");
  }

  const sortedAssets = [...mediaAssets].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );

  for (const asset of sortedAssets) {
    if (!isAmazonProductImageUrl(asset.url)) {
      continue;
    }

    add(
      asset.url,
      asset.altText ?? `${productTitle} product photo`,
      inferRoleFromAlt(asset.altText),
    );
  }

  return images;
}

function inferRoleFromAlt(alt?: string | null): ProductImageRole | undefined {
  if (!alt) {
    return undefined;
  }

  const normalized = alt.toLowerCase();

  if (normalized.includes("touch control") || normalized.includes("detail")) {
    return "detail";
  }

  if (normalized.includes("angle") || normalized.includes("adjustable")) {
    return "product";
  }

  if (
    normalized.includes("color mode") ||
    normalized.includes("brightness") ||
    normalized.includes("lighting")
  ) {
    return "detail";
  }

  if (normalized.includes("front") || normalized.includes("hero")) {
    return "hero";
  }

  return undefined;
}

function collectAmazonImages(input: {
  productTitle: string;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
  researchImages?: ProductResearchImage[];
}): ProductResearchImage[] {
  if (input.researchImages && input.researchImages.length > 0) {
    return input.researchImages.map((image) => ({
      ...image,
      url: isAmazonProductImageUrl(image.url)
        ? normalizeAmazonImageUrl(image.url)
        : image.url,
    }));
  }

  return mediaAssetsToResearchImages(
    input.productTitle,
    input.productImageUrl,
    input.mediaAssets ?? [],
  );
}

/** Amazon product/detail shots for inline section breaks — no generic stock photos. */
export function getSectionProductImages(input: {
  productTitle: string;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
  researchImages?: ProductResearchImage[];
}): EditorialImage[] {
  const images = collectAmazonImages(input);
  const sectionShots = selectSectionImages(images, 5);

  if (sectionShots.length > 0) {
    return sectionShots.map((image) => toEditorialImage(image, input.productTitle));
  }

  return [];
}

/** @deprecated Use getSectionProductImages — kept for callers without media assets. */
export function getSectionEditorialImages(input: {
  externalId?: string | null;
  title: string;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
  researchImages?: ProductResearchImage[];
}): EditorialImage[] {
  const productImages = getSectionProductImages({
    productTitle: input.title,
    productImageUrl: input.productImageUrl,
    mediaAssets: input.mediaAssets,
    researchImages: input.researchImages,
  });

  if (productImages.length >= 3) {
    return productImages;
  }

  const lifestyle = getEditorialImagesForProduct({
    externalId: input.externalId,
    title: input.title,
  }).slice(0, 1);

  return [...productImages, ...lifestyle];
}

/**
 * Hero gallery: Amazon product photos only (hero + product + detail shots).
 * Detail images with a clear product silhouette can appear here when ranked highly.
 */
export function buildProductHeroGallery(input: {
  productTitle: string;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
  researchImages?: ProductResearchImage[];
  limit?: number;
}): EditorialImage[] {
  const limit = input.limit ?? 3;
  const images = collectAmazonImages(input);
  const heroShots = selectHeroImages(images, limit);

  if (heroShots.length > 0) {
    return getHeroGalleryImages(
      heroShots.map((image) => toEditorialImage(image, input.productTitle)),
      limit,
    );
  }

  return [];
}

export function resolveHeroGalleryImages(input: {
  productTitle: string;
  externalId?: string | null;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
  researchImages?: ProductResearchImage[];
}): EditorialImage[] {
  const productGallery = buildProductHeroGallery(input);

  if (productGallery.length > 0) {
    return productGallery;
  }

  const editorial = getEditorialImagesForProduct({
    externalId: input.externalId,
    title: input.productTitle,
  });

  if (
    input.productImageUrl &&
    !editorial.some((image) => image.url === input.productImageUrl)
  ) {
    return getHeroGalleryImages(
      [
        {
          url: input.productImageUrl,
          alt: input.productTitle,
          caption: `${input.productTitle} product photo.`,
        },
        ...editorial,
      ],
      3,
    );
  }

  return getHeroGalleryImages(editorial, 3);
}

export function resolveProductCoverUrl(
  images: ProductResearchImage[],
  fallback?: string | null,
): string | undefined {
  const cover = resolveCoverImage(images);
  return cover?.url ?? fallback ?? undefined;
}

export { resolveCoverImage, selectHeroImages, selectSectionImages };
