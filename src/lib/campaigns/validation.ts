import { z } from "zod";

export const campaignStatusSchema = z.enum(["active", "paused", "archived"]);

export const campaignConfigSchema = z.object({
  searchIndex: z.string().trim().min(1).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  itemCount: z.number().int().min(1).max(20).optional(),
});

export const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  categoryId: z.string().uuid().nullable().optional(),
  status: campaignStatusSchema.default("active"),
  keywords: z.array(z.string().trim().min(1)).min(1),
  config: campaignConfigSchema.default({}),
  dailyProductLimit: z.number().int().min(1).max(100).default(10),
  priority: z.number().int().min(0).max(100).default(0),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
