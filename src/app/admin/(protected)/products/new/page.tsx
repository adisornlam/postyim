import Link from "next/link";

import { ManualProductForm } from "@/components/admin/manual-product-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCampaignsForAdmin } from "@/lib/reviews/queries";
import { getAmazonPartnerTag } from "@/lib/settings/runtime-config";

export default async function AdminNewProductPage() {
  const [campaigns, partnerTag] = await Promise.all([
    listCampaignsForAdmin(),
    getAmazonPartnerTag(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Add manual product</h1>
          <p className="max-w-2xl text-muted-foreground">
            Pre-PA-API workflow: enter a real Amazon ASIN, title, and target keyword.
            Postyim builds the affiliate link with your saved partner tag automatically.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/admin/products" />}>
          Back to catalog
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Amazon product</CardTitle>
          <CardDescription>
            Partner tag: {partnerTag || "Not configured — save it in Integrations first."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Create a campaign first, then return here to add a product.
            </p>
          ) : (
            <ManualProductForm
              campaigns={campaigns.map(({ campaign }) => ({
                id: campaign.id,
                name: campaign.name,
                slug: campaign.slug,
              }))}
              partnerTag={partnerTag}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
