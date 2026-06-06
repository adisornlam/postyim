import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import type { AffiliateNetwork } from "@/lib/affiliate/types";
import { getAffiliateAdapter } from "@/lib/affiliate/registry";
import {
  finishJobRun,
  logJobEvent,
  startJobRun,
  updateJobProgress,
} from "@/lib/jobs/logger";
import { updateProductPrice } from "@/lib/products/upsert";

export interface PriceRefreshResult {
  jobRunId: string;
  itemsProcessed: number;
  itemsFailed: number;
  status: "completed" | "failed";
}

export async function refreshProductPrices(input?: {
  campaignId?: string;
  productIds?: string[];
}): Promise<PriceRefreshResult> {
  const jobRun = await startJobRun({ jobType: "price_refresh" });
  const startedAt = jobRun.startedAt ?? new Date();

  let itemsProcessed = 0;
  let itemsFailed = 0;

  await logJobEvent({
    jobRunId: jobRun.id,
    message: "Starting price refresh",
    metadata: input,
  });

  try {
    const conditions = [eq(products.isActive, true)];

    if (input?.campaignId) {
      conditions.push(eq(products.campaignId, input.campaignId));
    }

    if (input?.productIds?.length) {
      conditions.push(inArray(products.id, input.productIds));
    }

    const catalog = await db
      .select()
      .from(products)
      .where(and(...conditions));

    const grouped = new Map<string, typeof catalog>();

    for (const product of catalog) {
      const group = grouped.get(product.affiliateNetwork) ?? [];
      group.push(product);
      grouped.set(product.affiliateNetwork, group);
    }

    for (const [network, networkProducts] of grouped) {
      const adapter = await getAffiliateAdapter(network as AffiliateNetwork);

      for (let index = 0; index < networkProducts.length; index += 10) {
        const batch = networkProducts.slice(index, index + 10);

        for (const product of batch) {
          try {
            const fresh = await adapter.getProduct(product.externalId);

            await updateProductPrice({
              productId: product.id,
              price: fresh.price,
              currency: fresh.currency,
              affiliateLink: fresh.affiliateLink,
              rawData: fresh.rawData,
            });

            itemsProcessed += 1;

            await logJobEvent({
              jobRunId: jobRun.id,
              message: `Refreshed price for ${product.externalId}`,
              metadata: {
                asin: product.externalId,
                price: fresh.price,
              },
            });
          } catch (error) {
            itemsFailed += 1;

            await db
              .update(products)
              .set({ syncStatus: "failed", updatedAt: new Date() })
              .where(eq(products.id, product.id));

            await logJobEvent({
              jobRunId: jobRun.id,
              level: "error",
              message: `Price refresh failed for ${product.externalId}`,
              metadata: {
                asin: product.externalId,
                error: error instanceof Error ? error.message : String(error),
              },
            });
          }

          await updateJobProgress({
            jobRunId: jobRun.id,
            itemsProcessed,
            itemsFailed,
          });
        }
      }
    }

    await finishJobRun({
      jobRunId: jobRun.id,
      status: "completed",
      itemsProcessed,
      itemsFailed,
      startedAt,
    });

    return {
      jobRunId: jobRun.id,
      itemsProcessed,
      itemsFailed,
      status: "completed",
    };
  } catch (error) {
    await finishJobRun({
      jobRunId: jobRun.id,
      status: "failed",
      itemsProcessed,
      itemsFailed,
      startedAt,
      errorDetails: {
        message: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}
