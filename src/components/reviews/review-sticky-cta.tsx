"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ReviewStickyCtaProps {
  productId: string;
  productTitle: string;
  priceLabel: string;
}

export function ReviewStickyCta({
  productId,
  productTitle,
  priceLabel,
}: ReviewStickyCtaProps) {
  return (
    <div
      className="review-sticky-cta fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{productTitle}</p>
          <p className="text-xs text-muted-foreground">{priceLabel}</p>
        </div>
        <Button
          size="lg"
          className="shrink-0 gap-2 bg-[var(--review-accent)] text-[var(--review-accent-foreground)] hover:bg-[var(--review-accent)]/90"
          render={
            <Link
              href={`/api/affiliate/${productId}`}
              rel="nofollow sponsored noopener"
            />
          }
        >
          Check price
          <ExternalLink className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
