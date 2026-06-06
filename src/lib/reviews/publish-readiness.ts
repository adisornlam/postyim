import { getSectionProductImages } from "@/lib/reviews/review-images";
import { enrichReviewContent } from "@/lib/reviews/enrich-review-content";
import {
  contentHasHtmlHeadings,
  countMarkdownHeadings,
  extractMarkdownImageUrls,
  isAllowedImageUrl,
  isPlaceholderImageUrl,
} from "@/lib/reviews/image-urls";
import { isAmazonProductImageUrl } from "@/lib/products/amazon-image-url";
import { resolveHeroGalleryImages } from "@/lib/reviews/review-images";
import { QUALITY_THRESHOLDS } from "@/lib/ai/constants";

export interface PublishReadinessInput {
  content: string;
  product: {
    title: string;
    externalId?: string | null;
    imageUrl?: string | null;
  };
  mediaAssets?: Array<{ url: string; altText?: string | null; sortOrder?: number }>;
}

export interface PublishReadinessResult {
  enrichedContent: string;
  heroImageCount: number;
  bodyImageCount: number;
  bodyProductImageCount: number;
  markdownHeadingCount: number;
  checklist: {
    noHtmlHeadings: boolean;
    hasMarkdownHeadings: boolean;
    bodyImagesValid: boolean;
    minBodyImages: boolean;
    minProductBodyImages: boolean;
    productHeroImage: boolean;
    minHeroImages: boolean;
    heroImagesAllAmazon: boolean;
  };
}

export function evaluatePublishReadiness(
  input: PublishReadinessInput,
): PublishReadinessResult {
  const sectionImages = getSectionProductImages({
    productTitle: input.product.title,
    productImageUrl: input.product.imageUrl,
    mediaAssets: input.mediaAssets,
  });

  const enrichedContent = enrichReviewContent(input.content, sectionImages);
  const bodyImageUrls = extractMarkdownImageUrls(enrichedContent);
  const bodyProductImageCount = bodyImageUrls.filter((url) =>
    isAmazonProductImageUrl(url),
  ).length;

  const heroImages = resolveHeroGalleryImages({
    productTitle: input.product.title,
    externalId: input.product.externalId,
    productImageUrl: input.product.imageUrl,
    mediaAssets: input.mediaAssets,
  });

  const bodyImagesValid =
    bodyImageUrls.length === 0 ||
    bodyImageUrls.every(
      (url) => isAllowedImageUrl(url) && !isPlaceholderImageUrl(url),
    );

  const markdownHeadingCount = countMarkdownHeadings(enrichedContent);
  const hasProductImage =
    Boolean(input.product.imageUrl) &&
    (isAmazonProductImageUrl(input.product.imageUrl ?? "") ||
      isAllowedImageUrl(input.product.imageUrl ?? ""));

  const heroImagesAllAmazon =
    heroImages.length === 0 ||
    heroImages.every((image) => isAmazonProductImageUrl(image.url));

  const checklist = {
    noHtmlHeadings: !contentHasHtmlHeadings(input.content),
    hasMarkdownHeadings:
      markdownHeadingCount >= QUALITY_THRESHOLDS.minMarkdownHeadings,
    bodyImagesValid,
    minBodyImages: bodyImageUrls.length >= QUALITY_THRESHOLDS.minBodyImages,
    minProductBodyImages:
      bodyProductImageCount >= QUALITY_THRESHOLDS.minProductBodyImages,
    productHeroImage: hasProductImage,
    minHeroImages: heroImages.length >= QUALITY_THRESHOLDS.minHeroImages,
    heroImagesAllAmazon,
  };

  return {
    enrichedContent,
    heroImageCount: heroImages.length,
    bodyImageCount: bodyImageUrls.length,
    bodyProductImageCount,
    markdownHeadingCount,
    checklist,
  };
}
