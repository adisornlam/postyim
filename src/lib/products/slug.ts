import { createHash } from "node:crypto";

export function slugify(text: string, maxLength = 200): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

export function buildProductSlug(title: string, externalId: string): string {
  const base = slugify(title, 160);
  const suffix = externalId.toLowerCase();

  if (!base) {
    return suffix;
  }

  return `${base}-${suffix}`.slice(0, 200);
}

export function buildDuplicateHash(
  network: string,
  externalId: string,
): string {
  return createHash("sha256")
    .update(`${network}:${externalId}`)
    .digest("hex");
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}
