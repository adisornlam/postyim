import Link from "next/link";
import { notFound } from "next/navigation";

import { CampaignActionButtons } from "@/components/admin/campaign-action-buttons";
import { CampaignForm } from "@/components/admin/campaign-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { parseAmazonCampaignConfig, parseCampaignKeywords } from "@/lib/affiliate/types";
import {
  getCampaignDetailForAdmin,
  listCategoriesForAdmin,
} from "@/lib/reviews/queries";

export default async function AdminCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, categories] = await Promise.all([
    getCampaignDetailForAdmin(id),
    listCategoriesForAdmin(),
  ]);

  if (!detail) {
    notFound();
  }

  const { campaign, productCount } = detail;
  const keywords = parseCampaignKeywords(campaign.keywords);
  const config = parseAmazonCampaignConfig(campaign.config);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/campaigns" className="hover:underline">
            Campaigns
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{campaign.name}</h1>
        <p className="text-muted-foreground">
          {productCount} products · last synced{" "}
          {campaign.lastSyncedAt?.toLocaleString() ?? "never"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit campaign</CardTitle>
          <CardDescription>
            Update keywords, limits, and Amazon search settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm
            mode="edit"
            campaignId={campaign.id}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
            }))}
            initialValues={{
              name: campaign.name,
              slug: campaign.slug,
              categoryId: campaign.categoryId ?? "",
              status: campaign.status,
              keywordsText: keywords.join("\n"),
              searchIndex: config.searchIndex ?? "HomeGarden",
              minPrice: config.minPrice?.toString() ?? "",
              maxPrice: config.maxPrice?.toString() ?? "",
              itemCount: config.itemCount?.toString() ?? "5",
              dailyProductLimit: campaign.dailyProductLimit.toString(),
              priority: campaign.priority.toString(),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign actions</CardTitle>
          <CardDescription>
            Trigger product ingestion or remove this campaign.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignActionButtons campaignId={campaign.id} />
        </CardContent>
      </Card>
    </div>
  );
}
