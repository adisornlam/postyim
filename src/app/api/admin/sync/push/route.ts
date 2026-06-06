import { z } from "zod";

import {
  unauthorizedSyncResponse,
  verifyRemoteSyncAuth,
} from "@/lib/sync/auth";
import { importSyncBundle } from "@/lib/sync/import-bundle";
import {
  legacySlugsFromProductRawData,
  revalidateAfterSync,
} from "@/lib/sync/revalidate-paths";
import { SYNC_BUNDLE_VERSION } from "@/lib/sync/types";

const syncBundleSchema = z.object({
  version: z.literal(SYNC_BUNDLE_VERSION),
  exportedAt: z.string(),
  product: z.object({
    campaignSlug: z.string().min(1),
    externalId: z.string().min(1),
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    price: z.string().nullable().optional(),
    currency: z.string().min(3).max(3),
    affiliateLink: z.string().url(),
    imageUrl: z.string().url().nullable().optional(),
    specs: z.record(z.string(), z.unknown()).optional(),
    rawData: z.unknown().optional(),
    categorySlug: z.string().optional(),
    mediaAssets: z
      .array(
        z.object({
          url: z.string().url(),
          altText: z.string().nullable().optional(),
          sortOrder: z.number().int(),
        }),
      )
      .optional(),
  }),
  review: z
    .object({
      slug: z.string().min(1),
      title: z.string().min(1),
      metaDescription: z.string().nullable().optional(),
      content: z.string().min(1),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      rating: z.string().nullable().optional(),
      status: z.string().min(1),
      wordCount: z.number().nullable().optional(),
      targetKeyword: z.string().optional(),
      authorSlug: z.string().optional(),
      publishedAt: z.string().nullable().optional(),
    })
    .optional(),
  keyword: z
    .object({
      keyword: z.string().min(1),
      intent: z.enum(["commercial", "informational", "transactional", "comparison"]).optional(),
    })
    .optional(),
  campaign: z
    .object({
      slug: z.string().min(1),
      name: z.string().min(1),
      keywords: z.array(z.string()),
      affiliateNetwork: z.literal("amazon"),
      status: z.enum(["active", "paused", "archived"]),
      config: z.record(z.string(), z.unknown()).optional(),
      dailyProductLimit: z.number().optional(),
      categorySlug: z.string().optional(),
    })
    .optional(),
  qualityScore: z
    .object({
      wordCountScore: z.number().nullable().optional(),
      uniquenessScore: z.number().nullable().optional(),
      specAccuracyScore: z.number().nullable().optional(),
      seoScore: z.number().nullable().optional(),
      overallScore: z.number().nullable().optional(),
      checklist: z.record(z.string(), z.boolean()),
      passed: z.boolean(),
    })
    .optional(),
});

export async function POST(request: Request) {
  if (!verifyRemoteSyncAuth(request)) {
    return unauthorizedSyncResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = syncBundleSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(" ") },
      { status: 400 },
    );
  }

  try {
    const result = await importSyncBundle(parsed.data);
    revalidateAfterSync({
      reviewSlug: parsed.data.review?.slug,
      legacyReviewSlugs: legacySlugsFromProductRawData(
        parsed.data.product.rawData,
      ),
    });
    return Response.json({ status: "ok", result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync import failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
