import { eq } from "drizzle-orm";

import { db } from "@/db";
import { mediaAssets } from "@/db/schema";

export async function syncProductMediaAssets(input: {
  productId: string;
  imageUrl?: string | null;
  title: string;
}) {
  if (!input.imageUrl) {
    return;
  }

  const existing = await db
    .select({ id: mediaAssets.id, url: mediaAssets.url })
    .from(mediaAssets)
    .where(eq(mediaAssets.productId, input.productId))
    .orderBy(mediaAssets.sortOrder);

  const primaryExists = existing.some((asset) => asset.url === input.imageUrl);

  if (primaryExists) {
    return;
  }

  if (existing.length === 0) {
    await db.insert(mediaAssets).values({
      productId: input.productId,
      type: "image",
      url: input.imageUrl,
      altText: `${input.title} product photo`,
      sortOrder: 0,
    });
    return;
  }

  await db
    .update(mediaAssets)
    .set({
      url: input.imageUrl,
      altText: `${input.title} product photo`,
    })
    .where(eq(mediaAssets.id, existing[0].id));
}
