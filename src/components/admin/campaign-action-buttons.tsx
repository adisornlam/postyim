"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CampaignActionButtons({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: "ingest" | "delete") {
    setLoading(action);
    setError(null);
    setMessage(null);

    try {
      if (action === "delete") {
        const confirmed = window.confirm(
          "Delete this campaign? Products linked to it may become orphaned.",
        );

        if (!confirmed) {
          return;
        }
      }

      const response = await fetch(
        action === "ingest"
          ? `/api/admin/campaigns/${campaignId}/ingest`
          : `/api/admin/campaigns/${campaignId}`,
        {
          method: action === "ingest" ? "POST" : "DELETE",
        },
      );

      const data = (await response.json()) as {
        error?: string;
        result?: { itemsProcessed?: number };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Action failed");
      }

      if (action === "delete") {
        router.push("/admin/campaigns");
        router.refresh();
        return;
      }

      setMessage(
        `Ingestion complete. ${data.result?.itemsProcessed ?? 0} products processed.`,
      );
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Action failed",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={Boolean(loading)}
          onClick={() => runAction("ingest")}
        >
          {loading === "ingest" ? "Ingesting..." : "Run ingestion now"}
        </Button>
        <Button
          variant="outline"
          disabled={Boolean(loading)}
          onClick={() => runAction("delete")}
        >
          {loading === "delete" ? "Deleting..." : "Delete campaign"}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
