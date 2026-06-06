import Link from "next/link";

import { DashboardSetupAlert } from "@/components/admin/dashboard-setup-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminStats } from "@/lib/reviews/queries";

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();
  const publishedCount =
    stats.reviewsByStatus.find((item) => item.status === "published")?.count ??
    0;
  const failedCount =
    stats.reviewsByStatus.find((item) => item.status === "failed")?.count ?? 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Editorial workflow overview — queue health, catalog size, and
          publishing progress.
        </p>
      </div>

      <DashboardSetupAlert />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Pending review</CardDescription>
            <CardTitle>{stats.pendingReviewCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Published reviews</CardDescription>
            <CardTitle>{publishedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Products in catalog</CardDescription>
            <CardTitle>{stats.productCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Active campaigns</CardDescription>
            <CardTitle>{stats.campaignCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Editorial pipeline</CardTitle>
            <CardDescription>Review status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {stats.reviewsByStatus.map((item) => (
              <Badge key={item.status} variant="secondary">
                {item.status.replaceAll("_", " ")}: {item.count}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
            <CardDescription>Operational items to review today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span>Reviews awaiting approval</span>
              <span className="font-semibold">{stats.pendingReviewCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span>Failed generations</span>
              <span className="font-semibold">{failedCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <span>Published live</span>
              <span className="font-semibold">{publishedCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Common editorial and catalog workflows</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button render={<Link href="/admin/reviews" />}>Open review queue</Button>
          <Button variant="outline" render={<Link href="/admin/campaigns/new" />}>
            New campaign
          </Button>
          <Button variant="outline" render={<Link href="/admin/products" />}>
            Browse catalog
          </Button>
          <Button variant="outline" render={<Link href="/admin/jobs" />}>
            View job logs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
