import { slugify } from "@/lib/products/slug";

export function buildCampaignSlug(name: string): string {
  return slugify(name, 100);
}
