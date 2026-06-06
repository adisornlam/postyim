import { eq } from "drizzle-orm";

import { db } from "@/db";
import { campaigns, keywords, mediaAssets, products, reviews } from "@/db/schema";
import { buildAmazonAffiliateLink } from "@/lib/affiliate/links";
import { normalizeAmazonImageUrl } from "@/lib/products/amazon-image-url";
import { resolveCoverImage } from "@/lib/products/image-roles";
import {
  productResearchSchema,
  type ProductResearch,
} from "@/lib/products/research-types";
import { upsertProduct } from "@/lib/products/upsert";
import { getAmazonPartnerTag } from "@/lib/settings/runtime-config";
import { getSiteUrl } from "@/lib/env";
import {
  buildReviewSlug,
  customerPhotoSortOrder,
  extractBrandFromTitle,
} from "@/lib/reviews/review-slug";

function researchToSpecs(research: ProductResearch): Record<string, unknown> {
  return {
    ...research.specs,
    verifiedFacts: research.verifiedFacts,
    rating: research.rating,
    reviewCount: research.reviewCount,
    researchedAt: research.researchedAt,
  };
}

export async function importProductResearch(input: unknown) {
  const research = productResearchSchema.parse(input);

  const campaignId = research.campaignId;
  if (!campaignId) {
    throw new Error("campaignId is required in research JSON.");
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  const partnerTag = await getAmazonPartnerTag();
  if (!partnerTag) {
    throw new Error("Partner tag is not configured.");
  }

  const affiliateLink = buildAmazonAffiliateLink(research.asin, partnerTag);
  const normalizedImages = research.productImages.map((image, index) => ({
    url: normalizeAmazonImageUrl(image.url),
    alt: image.alt ?? `${research.title} photo ${index + 1}`,
    role: image.role,
  }));

  const normalizedCustomerPhotos =
    research.customerPhotos?.map((image, index) => ({
      url: normalizeAmazonImageUrl(image.url),
      alt:
        image.alt ??
        `Customer photo: Lepro desk lamp in a real home office (${index + 1})`,
      role: "customer" as const,
    })) ?? [];

  const coverImage = resolveCoverImage(normalizedImages);
  const primaryImage = coverImage ?? normalizedImages[0];

  let keywordId: string | null = null;
  const [existingKeyword] = await db
    .select({ id: keywords.id })
    .from(keywords)
    .where(eq(keywords.keyword, research.targetKeyword))
    .limit(1);

  if (existingKeyword) {
    keywordId = existingKeyword.id;
  } else {
    const [createdKeyword] = await db
      .insert(keywords)
      .values({
        keyword: research.targetKeyword,
        intent: "commercial",
      })
      .returning({ id: keywords.id });
    keywordId = createdKeyword.id;
  }

  const product = await upsertProduct({
    campaignId: campaign.id,
    categoryId: campaign.categoryId,
    affiliateNetwork: "amazon",
    rawProduct: {
      externalId: research.asin.toUpperCase(),
      title: research.title,
      description: research.description ?? research.bullets.join(" "),
      price: research.price,
      currency: research.currency.toUpperCase(),
      affiliateLink,
      imageUrl: primaryImage?.url,
      specs: researchToSpecs(research),
      rawData: {
        source: "research-import",
        targetKeyword: research.targetKeyword,
        research,
      },
    },
  });

  await db.delete(mediaAssets).where(eq(mediaAssets.productId, product.id));

  const galleryAssets = [
    ...normalizedImages.map((image, index) => ({
      productId: product.id,
      type: "image" as const,
      url: image.url,
      altText: image.alt,
      sortOrder: index,
    })),
    ...normalizedCustomerPhotos.map((image, index) => ({
      productId: product.id,
      type: "image" as const,
      url: image.url,
      altText: `Customer photo: ${image.alt}`,
      sortOrder: customerPhotoSortOrder(index),
    })),
  ];

  if (galleryAssets.length > 0) {
    await db.insert(mediaAssets).values(galleryAssets);
  }

  const reviewSlug = buildReviewSlug({
    targetKeyword: research.targetKeyword,
    productTitle: research.title,
    brand:
      typeof research.specs.brand === "string"
        ? research.specs.brand
        : extractBrandFromTitle(research.title),
  });

  const [existingReview] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, product.id))
    .limit(1);

  if (existingReview && existingReview.slug !== reviewSlug) {
    const rawData =
      product.rawData && typeof product.rawData === "object"
        ? ({ ...(product.rawData as Record<string, unknown>) } as Record<
            string,
            unknown
          >)
        : {};
    const legacyReviewSlugs = Array.isArray(rawData.legacyReviewSlugs)
      ? [...(rawData.legacyReviewSlugs as string[])]
      : [];

    if (!legacyReviewSlugs.includes(existingReview.slug)) {
      legacyReviewSlugs.push(existingReview.slug);
    }

    rawData.legacyReviewSlugs = legacyReviewSlugs;

    await db
      .update(products)
      .set({ rawData, updatedAt: new Date() })
      .where(eq(products.id, product.id));

    await db
      .update(reviews)
      .set({
        slug: reviewSlug,
        canonicalUrl: `${getSiteUrl()}/reviews/${reviewSlug}`,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, existingReview.id));
  }

  return {
    product,
    keywordId,
    research,
    affiliateLink,
  };
}
