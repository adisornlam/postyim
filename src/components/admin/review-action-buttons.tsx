"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ReviewActionButtons({
  reviewId,
  status,
}: {
  reviewId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: string) {
    setLoading(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Action failed");
      }

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
        {status === "pending_review" && (
          <>
            <Button
              disabled={Boolean(loading)}
              onClick={() => runAction("approve")}
            >
              {loading === "approve" ? "Approving..." : "Approve"}
            </Button>
            <Button
              disabled={Boolean(loading)}
              onClick={() => runAction("approve_and_publish")}
            >
              {loading === "approve_and_publish"
                ? "Publishing..."
                : "Approve & Publish"}
            </Button>
            <Button
              variant="outline"
              disabled={Boolean(loading)}
              onClick={() => runAction("reject")}
            >
              {loading === "reject" ? "Rejecting..." : "Reject"}
            </Button>
          </>
        )}
        {status === "approved" && (
          <Button
            disabled={Boolean(loading)}
            onClick={() => runAction("publish")}
          >
            {loading === "publish" ? "Publishing..." : "Publish"}
          </Button>
        )}
        {["failed", "rejected"].includes(status) && (
          <Button
            variant="outline"
            disabled={Boolean(loading)}
            onClick={() => runAction("regenerate")}
          >
            {loading === "regenerate" ? "Regenerating..." : "Regenerate"}
          </Button>
        )}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
