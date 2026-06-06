"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProductGenerateReviewButton({
  productId,
  reviewStatus,
}: {
  productId: string;
  reviewStatus?: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockedStatuses = new Set([
    "pending_review",
    "approved",
    "scheduled",
    "published",
    "generating",
  ]);

  if (reviewStatus && blockedStatuses.has(reviewStatus)) {
    return null;
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/generate-review`,
        { method: "POST" },
      );
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed");
      }

      router.refresh();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Generation failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={loading}
        onClick={handleGenerate}
      >
        <Sparkles className="size-3.5" aria-hidden />
        {loading ? "Generating..." : "Generate review"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
