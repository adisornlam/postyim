import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCampaignsForAdmin } from "@/lib/reviews/queries";

export default async function AdminCampaignsPage() {
  const campaigns = await listCampaignsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground">
            Active ingestion campaigns and keyword targets.
          </p>
        </div>
        <Button render={<Link href="/admin/campaigns/new" />}>
          New campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign list</CardTitle>
          <CardDescription>{campaigns.length} campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Daily limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map(({ campaign, category, productCount }) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/campaigns/${campaign.id}`}
                      className="hover:underline"
                    >
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>{category?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>{productCount}</TableCell>
                  <TableCell>{campaign.dailyProductLimit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
