import { DEFAULT_DISCLOSURE } from "@/lib/ai/constants";

import type { EditorialImage } from "./editorial-images";

const TARGET_KEYWORD_PATTERN = /^target keyword:\s*.+$/gim;
const DUPLICATE_PADDING_PATTERN =
  /During extended testing of the .+?, I kept returning to the same question:[\s\S]*?expensive impulse buy\./g;

function stripEditorialNoise(content: string): string {
  return content
    .replace(TARGET_KEYWORD_PATTERN, "")
    .replace(DUPLICATE_PADDING_PATTERN, "")
    .replace(new RegExp(escapeRegex(DEFAULT_DISCLOSURE), "g"), "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sectionHasImage(content: string, headingIndex: number, nextHeadingIndex: number) {
  const section = content.slice(headingIndex, nextHeadingIndex);
  return /!\[[^\]]*\]\([^)]+\)/.test(section);
}

export function injectSectionImages(
  content: string,
  images: EditorialImage[],
): string {
  if (images.length === 0) {
    return content;
  }

  const headingRegex = /^##\s+(.+)$/gm;
  const matches = [...content.matchAll(headingRegex)];

  if (matches.length === 0) {
    return content;
  }

  let imageIndex = 0;
  let enriched = content;
  let offset = 0;

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const headingStart = match.index ?? 0;
    const headingEnd = headingStart + match[0].length;
    const nextHeadingStart =
      index + 1 < matches.length
        ? (matches[index + 1].index ?? enriched.length)
        : enriched.length;

    if (sectionHasImage(enriched, headingStart, nextHeadingStart)) {
      continue;
    }

    const image = images[imageIndex % images.length];
    imageIndex += 1;

    const figureMarkdown = `\n\n![${image.alt}](${image.url} "${image.caption ?? image.alt}")\n`;
    const insertAt = headingEnd + offset;

    enriched =
      enriched.slice(0, insertAt) + figureMarkdown + enriched.slice(insertAt);
    offset += figureMarkdown.length;
  }

  return enriched;
}

export function enrichReviewContent(
  content: string,
  images: EditorialImage[],
): string {
  const cleaned = stripEditorialNoise(content);
  return injectSectionImages(cleaned, images);
}

export function buildFigureId(caption: string): string {
  return `figure-${caption.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}`;
}
