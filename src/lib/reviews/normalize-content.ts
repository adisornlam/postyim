import type { EditorialImage } from "@/lib/reviews/editorial-images";
import {
  isAllowedImageUrl,
  isPlaceholderImageUrl,
} from "@/lib/reviews/image-urls";

const HTML_HEADING_REGEX = /<h([1-6])>\s*([^<]+?)\s*<\/h\1>/gi;
const MARKDOWN_IMAGE_REGEX =
  /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;

export function normalizeHtmlHeadingsToMarkdown(content: string): string {
  return content.replace(HTML_HEADING_REGEX, (_match, level, text) => {
    const hashes = "#".repeat(Number.parseInt(String(level), 10));
    return `${hashes} ${String(text).trim()}`;
  });
}

export function replaceInvalidImageUrls(
  content: string,
  replacements: EditorialImage[],
): string {
  if (replacements.length === 0) {
    return content;
  }

  let imageIndex = 0;

  return content.replace(
    MARKDOWN_IMAGE_REGEX,
    (match, alt: string, url: string, caption?: string) => {
      if (isAllowedImageUrl(url) && !isPlaceholderImageUrl(url)) {
        return match;
      }

      const image = replacements[imageIndex % replacements.length];
      imageIndex += 1;

      const nextAlt = alt.trim() || image.alt;
      const nextCaption = caption?.trim() || image.caption || image.alt;

      return `![${nextAlt}](${image.url} "${nextCaption}")`;
    },
  );
}

export function normalizeReviewContent(
  content: string,
  editorialImages: EditorialImage[],
): string {
  const withMarkdownHeadings = normalizeHtmlHeadingsToMarkdown(content);
  return replaceInvalidImageUrls(withMarkdownHeadings, editorialImages);
}
