import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSetupAttentionSummary } from "@/lib/admin/settings-status";

export async function DashboardSetupAlert() {
  const { integrationIssues, systemIssues, total } =
    await getSetupAttentionSummary();

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden
        />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
            {total} configuration {total === 1 ? "item needs" : "items need"}{" "}
            attention
          </p>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
            {integrationIssues > 0
              ? `${integrationIssues} marketplace or AI integration${integrationIssues === 1 ? "" : "s"}`
              : null}
            {integrationIssues > 0 && systemIssues > 0 ? " · " : null}
            {systemIssues > 0
              ? `${systemIssues} system setting${systemIssues === 1 ? "" : "s"}`
              : null}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pl-8 sm:pl-0">
        {integrationIssues > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 bg-background/80"
            render={<Link href="/admin/settings/integrations" />}
          >
            Integrations
          </Button>
        ) : null}
        {systemIssues > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 bg-background/80"
            render={<Link href="/admin/settings/system" />}
          >
            System settings
          </Button>
        ) : null}
      </div>
    </div>
  );
}
