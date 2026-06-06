import { getEditorialImagesForProduct } from "@/lib/reviews/editorial-images";
import { enrichReviewContent } from "@/lib/reviews/enrich-review-content";
import {
  contentHasHtmlHeadings,
  countMarkdownHeadings,
  extractMarkdownImageUrls,
  isAllowedImageUrl,
  isPlaceholderImageUrl,
} from "@/lib/reviews/image-urls";
import { QUALITY_THRESHOLDS } from "@/lib/ai/constants";

export interface PublishReadinessInput {
  content: string;
  product: {
    title: string;
    externalId?: string | null;
    imageUrl?: string | null;
  };
  mediaAssets?: Array<{ url: string }>;
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

function resolveHeroImages(input: PublishReadinessInput) {
  if (input.mediaAssets && input.mediaAssets.length > 0) {
    return input.mediaAssets.map((asset) => asset.url);
  }

  const editorial = getEditorialImagesForProduct({
    externalId: input.product.externalId,
    title: input.product.title,
  });

  const urls = editorial.map((image) => image.url);

  if (
    input.product.imageUrl &&
    !urls.includes(input.product.imageUrl)
  ) {
    return [input.product.imageUrl, ...urls];
  }

  return urls;
}

export function evaluatePublishReadiness(
  input: PublishReadinessInput,
): PublishReadinessResult {
  const editorialImages = getEditorialImagesForProduct({
    externalId: input.product.externalId,
    title: input.product.title,
  });

  const enrichedContent = enrichReviewContent(input.content, editorialImages);
  const bodyImageUrls = extractMarkdownImageUrls(enrichedContent);
  const heroImageUrls = resolveHeroImages(input);

  const bodyImagesValid =
    bodyImageUrls.length === 0 ||
    bodyImageUrls.every(
      (url) => isAllowedImageUrl(url) && !isPlaceholderImageUrl(url),
    );

  const markdownHeadingCount = countMarkdownHeadings(enrichedContent);

  const checklist = {
    noHtmlHeadings: !contentHasHtmlHeadings(input.content),
    hasMarkdownHeadings:
      markdownHeadingCount >= QUALITY_THRESHOLDS.minMarkdownHeadings,
    bodyImagesValid,
    minBodyImages: bodyImageUrls.length >= QUALITY_THRESHOLDS.minBodyImages,
    productHeroImage:
      Boolean(input.product.imageUrl) &&
      isAllowedImageUrl(input.product.imageUrl ?? ""),
    minHeroImages: heroImageUrls.length >= QUALITY_THRESHOLDS.minHeroImages,
  };

  return {
    enrichedContent,
    heroImageCount: heroImageUrls.length,
    bodyImageCount: bodyImageUrls.length,
    markdownHeadingCount,
    checklist,
  };
}
