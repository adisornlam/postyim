import { slugify } from "@/lib/products/slug";

const CUSTOMER_PHOTO_SORT_OFFSET = 1000;

export function extractBrandFromTitle(title: string): string | undefined {
  const firstToken = title.trim().split(/\s+/)[0];
  if (!firstToken || firstToken.length < 2) {
    return undefined;
  }

  return firstToken.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Keyword-first review URL — ASIN lives in product metadata / JSON-LD, not the slug.
 */
export function buildReviewSlug(input: {
  targetKeyword: string;
  productTitle?: string;
  brand?: string;
}): string {
  const keywordSlug = slugify(input.targetKeyword, 100);
  const brand =
    input.brand?.trim() ||
    (input.productTitle ? extractBrandFromTitle(input.productTitle) : undefined);
  const brandSlug = brand ? slugify(brand, 24) : "";

  if (brandSlug && !keywordSlug.includes(brandSlug)) {
    return `${keywordSlug}-${brandSlug}-review`.slice(0, 200);
  }

  return `${keywordSlug}-review`.slice(0, 200);
}

export function isCustomerPhotoAsset(input: {
  altText?: string | null;
  sortOrder?: number;
}): boolean {
  if ((input.sortOrder ?? 0) >= CUSTOMER_PHOTO_SORT_OFFSET) {
    return true;
  }

  const alt = input.altText?.toLowerCase() ?? "";
  return alt.startsWith("customer photo:") || alt.includes("verified purchaser");
}

export function customerPhotoSortOrder(index: number): number {
  return CUSTOMER_PHOTO_SORT_OFFSET + index;
}

export { CUSTOMER_PHOTO_SORT_OFFSET };
