"use client";

import { useState } from "react";
import { CloudUpload } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ReviewSyncPanel({
  reviewId,
  reviewSlug,
  reviewStatus,
  remoteConfigured,
  remoteUrl,
}: {
  reviewId: string;
  reviewSlug: string;
  reviewStatus: string;
  remoteConfigured: boolean;
  remoteUrl?: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!remoteConfigured) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Remote sync is not configured on this server. Set{" "}
        <code className="text-xs">POSTYIM_REMOTE_URL</code> and{" "}
        <code className="text-xs">REMOTE_SYNC_SECRET</code> in `.env.local`, then
        use `pnpm sync:push --review-slug={reviewSlug}` from localhost.
      </div>
    );
  }

  async function push(publish: boolean) {
    const action = publish ? "publish" : "push";
    setLoading(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/sync/push-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, publish }),
      });
      const data = (await response.json()) as {
        error?: string;
        result?: { reviewSlug?: string; reviewStatus?: string };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Sync failed");
      }

      setMessage(
        publish
          ? `Published on ${remoteUrl}: /reviews/${data.result?.reviewSlug}`
          : `Synced draft to ${remoteUrl}.`,
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Sync failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border px-4 py-4">
      <div>
        <p className="font-medium">Production sync</p>
        <p className="text-sm text-muted-foreground">
          Push this review from localhost to {remoteUrl}. Current status:{" "}
          {reviewStatus}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={Boolean(loading)}
          onClick={() => push(false)}
        >
          <CloudUpload className="size-3.5" aria-hidden />
          {loading === "push" ? "Syncing..." : "Sync draft"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={Boolean(loading) || !["approved", "published", "pending_review"].includes(reviewStatus)}
          onClick={() => push(true)}
        >
          {loading === "publish" ? "Publishing..." : "Sync & publish"}
        </Button>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
