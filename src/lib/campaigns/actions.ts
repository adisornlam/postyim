import { eq } from "drizzle-orm";

import { db } from "@/db";
import { campaigns } from "@/db/schema";
import {
  createCampaignSchema,
  updateCampaignSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "@/lib/campaigns/validation";

export async function getCampaignById(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  return campaign ?? null;
}

export async function createCampaign(input: CreateCampaignInput) {
  const parsed = createCampaignSchema.parse(input);

  const [campaign] = await db
    .insert(campaigns)
    .values({
      name: parsed.name,
      slug: parsed.slug,
      categoryId: parsed.categoryId ?? null,
      affiliateNetwork: "amazon",
      status: parsed.status,
      keywords: parsed.keywords,
      config: parsed.config,
      dailyProductLimit: parsed.dailyProductLimit,
      priority: parsed.priority,
    })
    .returning();

  return campaign;
}

export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput,
) {
  const parsed = updateCampaignSchema.parse(input);
  const existing = await getCampaignById(campaignId);

  if (!existing) {
    throw new Error("Campaign not found");
  }

  const [campaign] = await db
    .update(campaigns)
    .set({
      ...(parsed.name !== undefined ? { name: parsed.name } : {}),
      ...(parsed.slug !== undefined ? { slug: parsed.slug } : {}),
      ...(parsed.categoryId !== undefined
        ? { categoryId: parsed.categoryId }
        : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      ...(parsed.keywords !== undefined ? { keywords: parsed.keywords } : {}),
      ...(parsed.config !== undefined ? { config: parsed.config } : {}),
      ...(parsed.dailyProductLimit !== undefined
        ? { dailyProductLimit: parsed.dailyProductLimit }
        : {}),
      ...(parsed.priority !== undefined ? { priority: parsed.priority } : {}),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId))
    .returning();

  return campaign;
}

export async function deleteCampaign(campaignId: string) {
  const existing = await getCampaignById(campaignId);

  if (!existing) {
    throw new Error("Campaign not found");
  }

  await db.delete(campaigns).where(eq(campaigns.id, campaignId));
}
