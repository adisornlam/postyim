import { getSectionEditorialImages } from "@/lib/reviews/review-images";
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
  markdownHeadingCount: number;
  checklist: {
    noHtmlHeadings: boolean;
    hasMarkdownHeadings: boolean;
    bodyImagesValid: boolean;
    minBodyImages: boolean;
    productHeroImage: boolean;
    minHeroImages: boolean;
  };
}

export function evaluatePublishReadiness(
  input: PublishReadinessInput,
): PublishReadinessResult {
  const sectionImages = getSectionEditorialImages({
    externalId: input.product.externalId,
    title: input.product.title,
  });

  const enrichedContent = enrichReviewContent(input.content, sectionImages);
  const bodyImageUrls = extractMarkdownImageUrls(enrichedContent);
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

  const checklist = {
    noHtmlHeadings: !contentHasHtmlHeadings(input.content),
    hasMarkdownHeadings:
      markdownHeadingCount >= QUALITY_THRESHOLDS.minMarkdownHeadings,
    bodyImagesValid,
    minBodyImages: bodyImageUrls.length >= QUALITY_THRESHOLDS.minBodyImages,
    productHeroImage: hasProductImage,
    minHeroImages: heroImages.length >= QUALITY_THRESHOLDS.minHeroImages,
  };

  return {
    enrichedContent,
    heroImageCount: heroImages.length,
    bodyImageCount: bodyImageUrls.length,
    markdownHeadingCount,
    checklist,
  };
}
