import Link from "next/link";

import { CampaignForm } from "@/components/admin/campaign-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listCategoriesForAdmin } from "@/lib/reviews/queries";

export default async function AdminNewCampaignPage() {
  const categories = await listCategoriesForAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/campaigns" className="hover:underline">
            Campaigns
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">New campaign</h1>
        <p className="text-muted-foreground">
          Create a keyword campaign for Amazon product ingestion.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign details</CardTitle>
          <CardDescription>
            Keywords drive product discovery during daily ingestion jobs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm
            mode="create"
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
