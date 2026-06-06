import Link from "next/link";

import { LaunchChecklistPanel } from "@/components/admin/launch-checklist-panel";
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
  getLaunchChecklist,
  summarizeLaunchChecklist,
} from "@/lib/admin/launch-checklist";
import { getRemoteSyncConfig } from "@/lib/sync/config";

export default async function AdminLaunchPage() {
  const checks = await getLaunchChecklist();
  const summary = summarizeLaunchChecklist(checks);
  const remote = getRemoteSyncConfig();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Launch checklist</h1>
        <p className="max-w-3xl text-muted-foreground">
          Pre-PA-API workflow for postyim.com: build and refine on localhost with
          Cursor, generate reviews with live Gemini, then sync approved content to
          production.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Ready</CardDescription>
            <CardTitle>{summary.ready}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Warnings</CardDescription>
            <CardTitle>{summary.warning}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Missing</CardDescription>
            <CardTitle>{summary.missing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Manual steps</CardDescription>
            <CardTitle>{summary.manual}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Localhost → production bridge</CardTitle>
          <CardDescription>
            Use the same codebase in Cursor locally, then push content to the live
            site without redeploying for every editorial change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant={remote.isConfigured ? "default" : "secondary"}>
              {remote.isConfigured ? "Sync configured" : "Sync not configured"}
            </Badge>
            {remote.remoteUrl ? (
              <Badge variant="outline">{remote.remoteUrl}</Badge>
            ) : null}
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Create a manual product with a real ASIN on localhost.</li>
            <li>Generate the review with live Gemini and pass QC in Admin.</li>
            <li>
              Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                pnpm sync:push --review-slug=your-slug-review --publish
              </code>
            </li>
            <li>Verify the live page on postyim.com and submit sitemap to GSC.</li>
          </ol>

          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/admin/products/new" />}>
              Add manual product
            </Button>
            <Button variant="outline" render={<Link href="/admin/reviews" />}>
              Open review queue
            </Button>
          </div>
        </CardContent>
      </Card>

      <LaunchChecklistPanel checks={checks} />
    </div>
  );
}
