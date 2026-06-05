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
import { ProductionReadinessCard } from "@/components/admin/production-readiness-card";
import { getAdminStats } from "@/lib/reviews/queries";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor editorial workflow, publishing queue, and catalog health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Pending review</CardDescription>
            <CardTitle>{stats.pendingReviewCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Products</CardDescription>
            <CardTitle>{stats.productCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Campaigns</CardDescription>
            <CardTitle>{stats.campaignCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published reviews</CardDescription>
            <CardTitle>
              {stats.reviewsByStatus.find((item) => item.status === "published")
                ?.count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review statuses</CardTitle>
          <CardDescription>Current editorial pipeline breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {stats.reviewsByStatus.map((item) => (
            <Badge key={item.status} variant="secondary">
              {item.status}: {item.count}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button render={<Link href="/admin/reviews" />}>Review queue</Button>
        <Button variant="outline" render={<Link href="/admin/campaigns/new" />}>
          New campaign
        </Button>
        <Button variant="outline" render={<Link href="/admin/products" />}>
          Products
        </Button>
        <Button variant="outline" render={<Link href="/admin/jobs" />}>
          Job logs
        </Button>
      </div>

      <ProductionReadinessCard />
    </div>
  );
}
