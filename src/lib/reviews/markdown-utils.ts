export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractMarkdownHeadings(
  content: string,
): Array<{ id: string; text: string }> {
  const headings: Array<{ id: string; text: string }> = [];
  const regex = /^##\s+(.+)$/gm;

  for (const match of content.matchAll(regex)) {
    const text = match[1]?.trim();
    if (text) {
      headings.push({ id: slugifyHeading(text), text });
    }
  }

  return headings;
}

export function formatReviewDate(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
