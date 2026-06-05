import type { RawProduct } from "@/lib/affiliate/types";
import type { AffiliateNetwork } from "@/lib/affiliate/types";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import {
  buildDuplicateHash,
  buildProductSlug,
} from "@/lib/products/slug";
import { syncProductMediaAssets } from "@/lib/products/media-sync";

export async function upsertProduct(input: {
  campaignId: string;
  categoryId?: string | null;
  affiliateNetwork: AffiliateNetwork;
  rawProduct: RawProduct;
}) {
  const { rawProduct, campaignId, categoryId, affiliateNetwork } = input;
  const now = new Date();
  const duplicateHash = buildDuplicateHash(
    affiliateNetwork,
    rawProduct.externalId,
  );
  const slug = buildProductSlug(rawProduct.title, rawProduct.externalId);

  const [product] = await db
    .insert(products)
    .values({
      campaignId,
      categoryId: categoryId ?? null,
      affiliateNetwork,
      externalId: rawProduct.externalId,
      slug,
      title: rawProduct.title,
      description: rawProduct.description,
      specs: rawProduct.specs,
      rawData: rawProduct.rawData,
      price: rawProduct.price?.toFixed(2),
      currency: rawProduct.currency,
      affiliateLink: rawProduct.affiliateLink,
      imageUrl: rawProduct.imageUrl,
      duplicateHash,
      syncStatus: "synced",
      isActive: true,
      lastSyncedAt: now,
    })
    .onConflictDoUpdate({
      target: [products.affiliateNetwork, products.externalId],
      set: {
        title: rawProduct.title,
        description: rawProduct.description,
        specs: rawProduct.specs,
        rawData: rawProduct.rawData,
        price: rawProduct.price?.toFixed(2),
        currency: rawProduct.currency,
        affiliateLink: rawProduct.affiliateLink,
        imageUrl: rawProduct.imageUrl,
        syncStatus: "synced",
        isActive: true,
        lastSyncedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  await syncProductMediaAssets({
    productId: product.id,
    imageUrl: rawProduct.imageUrl,
    title: rawProduct.title,
  });

  return product;
}

export async function updateProductPrice(input: {
  productId: string;
  price?: number;
  currency?: string;
  affiliateLink?: string;
  rawData: unknown;
}) {
  const now = new Date();

  await db
    .update(products)
    .set({
      price: input.price?.toFixed(2),
      currency: input.currency,
      affiliateLink: input.affiliateLink,
      rawData: input.rawData,
      syncStatus: "synced",
      lastSyncedAt: now,
      updatedAt: now,
    })
    .where(eq(products.id, input.productId));
}
