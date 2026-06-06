import { revalidatePath } from "next/cache";

export function revalidateAfterSync(input: {
  reviewSlug?: string;
  legacyReviewSlugs?: string[];
}) {
  revalidatePath("/");
  revalidatePath("/reviews");

  if (input.reviewSlug) {
    revalidatePath(`/reviews/${input.reviewSlug}`);
  }

  for (const legacySlug of input.legacyReviewSlugs ?? []) {
    revalidatePath(`/reviews/${legacySlug}`);
  }
}

function readLegacySlugs(rawData: unknown): string[] {
  if (!rawData || typeof rawData !== "object") {
    return [];
  }

  const legacy = (rawData as { legacyReviewSlugs?: unknown }).legacyReviewSlugs;
  if (!Array.isArray(legacy)) {
    return [];
  }

  return legacy.filter((slug): slug is string => typeof slug === "string");
}

export function legacySlugsFromProductRawData(rawData: unknown): string[] {
  return readLegacySlugs(rawData);
}
