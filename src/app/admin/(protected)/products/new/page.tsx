import Link from "next/link";

import { ManualProductForm } from "@/components/admin/manual-product-form";
import { ProductDiscoveryPanel } from "@/components/admin/product-discovery-panel";
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

  const campaignOptions = campaigns.map(({ campaign }) => ({
    id: campaign.id,
    name: campaign.name,
    slug: campaign.slug,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Discover products</h1>
          <p className="max-w-2xl text-muted-foreground">
            Pre-PA-API workflow: Gemini searches Amazon for high-demand, commission-worthy
            products. Pick a candidate to import — no deploy required, then generate the
            review from the product catalog.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/admin/products" />}>
          Back to catalog
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Create a campaign with target keywords first, then return here to run
              discovery.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>AI product discovery</CardTitle>
              <CardDescription>
                Finds up to 10 Amazon US products with sustained commercial demand and
                strong affiliate potential. Results are saved only when you import a
                candidate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductDiscoveryPanel campaigns={campaignOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual entry (fallback)</CardTitle>
              <CardDescription>
                Partner tag:{" "}
                {partnerTag || "Not configured — save it in Integrations first."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ManualProductForm campaigns={campaignOptions} partnerTag={partnerTag} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
