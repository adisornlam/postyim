const ALLOWED_IMAGE_HOSTS = new Set([
  "images.unsplash.com",
  "m.media-amazon.com",
  "images-na.ssl-images-amazon.com",
]);

const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "www.example.com",
  "placeholder.com",
  "via.placeholder.com",
  "placehold.co",
  "placekitten.com",
  "picsum.photos",
  "localhost",
]);

const MARKDOWN_IMAGE_URL_REGEX = /!\[[^\]]*\]\(([^)\s]+)/g;

export function isAllowedImageHost(hostname: string): boolean {
  return ALLOWED_IMAGE_HOSTS.has(hostname.toLowerCase());
}

export function isPlaceholderImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      PLACEHOLDER_HOSTS.has(host) ||
      host.endsWith(".example.com") ||
      host.endsWith(".local") ||
      parsed.pathname.includes("/placeholder")
    );
  } catch {
    return true;
  }
}

export function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      isAllowedImageHost(parsed.hostname) &&
      !isPlaceholderImageUrl(url)
    );
  } catch {
    return false;
  }
}

export function extractMarkdownImageUrls(content: string): string[] {
  const urls: string[] = [];

  for (const match of content.matchAll(MARKDOWN_IMAGE_URL_REGEX)) {
    const url = match[1]?.replace(/^["']|["']$/g, "");
    if (url) {
      urls.push(url);
    }
  }

  return urls;
}

export function countMarkdownHeadings(content: string): number {
  return [...content.matchAll(/^#{2,3}\s+.+$/gm)].length;
}

export function contentHasHtmlHeadings(content: string): boolean {
  return /<h[1-6][^>]*>/i.test(content);
}
