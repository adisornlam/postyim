/** Normalize Amazon image URLs to a usable hi-res variant for the review gallery. */
export function normalizeAmazonImageUrl(url: string, width = 1500): string {
  const trimmed = url.trim();

  const idMatch = trimmed.match(/\/images\/I\/([A-Za-z0-9+_-]+)\./);
  if (!idMatch) {
    return trimmed;
  }

  const imageId = idMatch[1];
  return `https://m.media-amazon.com/images/I/${imageId}._AC_SL${width}_.jpg`;
}

export function isAmazonProductImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "m.media-amazon.com" || host === "images-na.ssl-images-amazon.com";
  } catch {
    return false;
  }
}
