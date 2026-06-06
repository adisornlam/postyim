import type { ProductResearchImage } from "@/lib/products/research-types";

export const PRODUCT_IMAGE_ROLES = [
  "hero",
  "product",
  "detail",
  "lifestyle",
  "diagram",
] as const;

export type ProductImageRole = (typeof PRODUCT_IMAGE_ROLES)[number];

const COVER_ROLE_PRIORITY: ProductImageRole[] = [
  "hero",
  "product",
  "detail",
];

const HERO_ROLE_PRIORITY: ProductImageRole[] = [
  "hero",
  "product",
  "detail",
];

const SECTION_ROLE_PRIORITY: ProductImageRole[] = [
  "detail",
  "product",
  "hero",
];

export function isProductImageRole(value: string): value is ProductImageRole {
  return (PRODUCT_IMAGE_ROLES as readonly string[]).includes(value);
}

export function roleSortIndex(
  role: ProductImageRole | undefined,
  priority: ProductImageRole[],
): number {
  if (!role) {
    return priority.length;
  }

  const index = priority.indexOf(role);
  return index === -1 ? priority.length : index;
}

export function sortImagesByRole<T extends { role?: ProductImageRole }>(
  images: T[],
  priority: ProductImageRole[],
): T[] {
  return [...images].sort(
    (a, b) =>
      roleSortIndex(a.role, priority) - roleSortIndex(b.role, priority),
  );
}

/** Best cover/thumbnail: hero first, then clearest full-product shot. */
export function resolveCoverImage(
  images: ProductResearchImage[],
): ProductResearchImage | undefined {
  if (images.length === 0) {
    return undefined;
  }

  const ranked = sortImagesByRole(images, COVER_ROLE_PRIORITY);
  return ranked[0];
}

export function selectHeroImages(
  images: ProductResearchImage[],
  limit = 3,
): ProductResearchImage[] {
  const amazonOnly = images.filter(
    (image) => image.role !== "lifestyle" && image.role !== "diagram",
  );

  const ranked = sortImagesByRole(amazonOnly, HERO_ROLE_PRIORITY);
  const unique = dedupeByUrl(ranked);

  return unique.slice(0, limit);
}

export function selectSectionImages(
  images: ProductResearchImage[],
  limit = 5,
): ProductResearchImage[] {
  const amazonOnly = images.filter((image) => image.role !== "lifestyle");

  const ranked = sortImagesByRole(amazonOnly, SECTION_ROLE_PRIORITY);
  const unique = dedupeByUrl(ranked);

  return unique.slice(0, limit);
}

function dedupeByUrl<T extends { url: string }>(images: T[]): T[] {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
}
