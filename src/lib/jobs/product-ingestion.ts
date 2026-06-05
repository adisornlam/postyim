import { eq } from "drizzle-orm";

import { db } from "@/db";
import { campaigns } from "@/db/schema";
import {
  getAdapterMode,
  getAffiliateAdapter,
} from "@/lib/affiliate/registry";
import {
  parseAmazonCampaignConfig,
  parseCampaignKeywords,
} from "@/lib/affiliate/types";
import {
  finishJobRun,
  logJobEvent,
  startJobRun,
  updateJobProgress,
} from "@/lib/jobs/logger";
import { upsertProduct } from "@/lib/products/upsert";

export interface IngestionResult {
  jobRunId: string;
  campaignId: string;
  campaignSlug: string;
  mode: "live" | "mock";
  itemsProcessed: number;
  itemsFailed: number;
  status: "completed" | "failed";
}

export async function ingestCampaignProducts(
  campaignId: string,
): Promise<IngestionResult> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  if (campaign.status !== "active") {
    throw new Error(`Campaign "${campaign.slug}" is not active`);
  }

  const keywords = parseCampaignKeywords(campaign.keywords);
  if (keywords.length === 0) {
    throw new Error(`Campaign "${campaign.slug}" has no keywords configured`);
  }

  const config = parseAmazonCampaignConfig(campaign.config);
  const adapter = getAffiliateAdapter(campaign.affiliateNetwork);
  const mode = getAdapterMode(campaign.affiliateNetwork);
  const jobRun = await startJobRun({
    jobType: "product_ingestion",
    campaignId: campaign.id,
  });
  const startedAt = jobRun.startedAt ?? new Date();

  let itemsProcessed = 0;
  let itemsFailed = 0;
  const seenAsins = new Set<string>();
  const dailyLimit = campaign.dailyProductLimit;
  const perKeywordLimit = Math.max(
    1,
    Math.ceil(dailyLimit / keywords.length),
  );

  await logJobEvent({
    jobRunId: jobRun.id,
    message: `Starting product ingestion for campaign "${campaign.name}"`,
    metadata: {
      mode,
      keywords,
      dailyLimit,
      perKeywordLimit,
    },
  });

  try {
    for (const keyword of keywords) {
      if (itemsProcessed >= dailyLimit) {
        break;
      }

      const remaining = dailyLimit - itemsProcessed;
      const itemCount = Math.min(perKeywordLimit, remaining, config.itemCount ?? 10);

      await logJobEvent({
        jobRunId: jobRun.id,
        message: `Searching products for keyword "${keyword}"`,
        metadata: { keyword, itemCount },
      });

      let results;

      try {
        results = await adapter.searchProducts({
          keywords: keyword,
          searchIndex: config.searchIndex,
          itemCount,
          minPrice: config.minPrice,
          maxPrice: config.maxPrice,
          minRating: config.minRating,
        });
      } catch (error) {
        itemsFailed += 1;
        await logJobEvent({
          jobRunId: jobRun.id,
          level: "error",
          message: `Search failed for keyword "${keyword}"`,
          metadata: {
            keyword,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        continue;
      }

      for (const rawProduct of results) {
        if (itemsProcessed >= dailyLimit) {
          break;
        }

        if (seenAsins.has(rawProduct.externalId)) {
          continue;
        }

        seenAsins.add(rawProduct.externalId);

        try {
          await upsertProduct({
            campaignId: campaign.id,
            categoryId: campaign.categoryId,
            affiliateNetwork: campaign.affiliateNetwork,
            rawProduct,
          });

          itemsProcessed += 1;

          await logJobEvent({
            jobRunId: jobRun.id,
            message: `Stored product ${rawProduct.externalId}`,
            metadata: {
              asin: rawProduct.externalId,
              title: rawProduct.title,
            },
          });
        } catch (error) {
          itemsFailed += 1;
          await logJobEvent({
            jobRunId: jobRun.id,
            level: "error",
            message: `Failed to store product ${rawProduct.externalId}`,
            metadata: {
              asin: rawProduct.externalId,
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

    await db
      .update(campaigns)
      .set({ lastSyncedAt: new Date(), updatedAt: new Date() })
      .where(eq(campaigns.id, campaign.id));

    await finishJobRun({
      jobRunId: jobRun.id,
      status: "completed",
      itemsProcessed,
      itemsFailed,
      startedAt,
      errorDetails: { mode, keywords },
    });

    await logJobEvent({
      jobRunId: jobRun.id,
      message: "Product ingestion completed",
      metadata: { itemsProcessed, itemsFailed, mode },
    });

    return {
      jobRunId: jobRun.id,
      campaignId: campaign.id,
      campaignSlug: campaign.slug,
      mode,
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
        mode,
        message: error instanceof Error ? error.message : String(error),
      },
    });

    await logJobEvent({
      jobRunId: jobRun.id,
      level: "error",
      message: "Product ingestion failed",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

export async function ingestActiveCampaigns(): Promise<IngestionResult[]> {
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "active"));

  const results: IngestionResult[] = [];

  for (const campaign of activeCampaigns) {
    results.push(await ingestCampaignProducts(campaign.id));
  }

  return results;
}
