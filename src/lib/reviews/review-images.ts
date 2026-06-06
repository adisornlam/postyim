import {
  getEditorialImagesForProduct,
  getHeroGalleryImages,
  type EditorialImage,
} from "@/lib/reviews/editorial-images";
import {
  isAmazonProductImageUrl,
  normalizeAmazonImageUrl,
} from "@/lib/products/amazon-image-url";

export interface ReviewMediaAsset {
  url: string;
  altText?: string | null;
  sortOrder?: number;
}

/** Lifestyle/editorial shots for inline section breaks (Unsplash). */
export function getSectionEditorialImages(input: {
  externalId?: string | null;
  title: string;
}): EditorialImage[] {
  return getEditorialImagesForProduct(input);
}

function amazonGalleryImages(
  productTitle: string,
  productImageUrl?: string | null,
  mediaAssets: ReviewMediaAsset[] = [],
): EditorialImage[] {
  const urls = new Set<string>();
  const images: EditorialImage[] = [];

  const add = (url: string, alt: string, caption?: string) => {
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
      caption: caption ?? alt,
    });
  };

  if (productImageUrl && isAmazonProductImageUrl(productImageUrl)) {
    add(productImageUrl, `${productTitle} product photo`);
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
      asset.altText ?? undefined,
    );
  }

  return images;
}

/**
 * Hero gallery: real Amazon product photos first, then one Unsplash lifestyle shot.
 */
export function buildHybridHeroGallery(input: {
  productTitle: string;
  externalId?: string | null;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
  limit?: number;
}): EditorialImage[] {
  const limit = input.limit ?? 3;
  const productShots = amazonGalleryImages(
    input.productTitle,
    input.productImageUrl,
    input.mediaAssets ?? [],
  );

  const editorial = getEditorialImagesForProduct({
    externalId: input.externalId,
    title: input.productTitle,
  });

  const lifestyle =
    editorial.find((image) => !isAmazonProductImageUrl(image.url)) ??
    editorial[0];

  const hybrid: EditorialImage[] = [];

  for (const shot of productShots.slice(0, Math.max(1, limit - 1))) {
    hybrid.push(shot);
  }

  if (lifestyle && hybrid.length < limit) {
    hybrid.push({
      ...lifestyle,
      caption: lifestyle.caption ?? "Desk lamp in a real home office setup.",
    });
  }

  while (hybrid.length < limit && productShots[hybrid.length]) {
    hybrid.push(productShots[hybrid.length]);
  }

  return getHeroGalleryImages(hybrid, limit);
}

export function resolveHeroGalleryImages(input: {
  productTitle: string;
  externalId?: string | null;
  productImageUrl?: string | null;
  mediaAssets?: ReviewMediaAsset[];
}): EditorialImage[] {
  const amazonCount =
    (input.productImageUrl && isAmazonProductImageUrl(input.productImageUrl)
      ? 1
      : 0) +
    (input.mediaAssets ?? []).filter((asset) =>
      isAmazonProductImageUrl(asset.url),
    ).length;

  if (amazonCount > 0) {
    return buildHybridHeroGallery(input);
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
