import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ReviewScoreRing } from "@/components/reviews/review-score-ring";
import { Button } from "@/components/ui/button";

interface ReviewAtAGlanceBarProps {
  productTitle: string;
  productId: string;
  priceLabel: string;
  rating?: number | null;
}

export function ReviewAtAGlanceBar({
  productTitle,
  productId,
  priceLabel,
  rating,
}: ReviewAtAGlanceBarProps) {
  return (
    <section
      aria-label="Product summary"
      className="review-at-a-glance rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {rating ? (
            <div className="hidden shrink-0 sm:block">
              <ReviewScoreRing rating={rating} label="Score" />
            </div>
          ) : null}

          <div className="min-w-0 space-y-1">
            <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-snug tracking-tight">
              {productTitle}
            </p>
            <p className="text-sm text-muted-foreground">{priceLabel}</p>
            {rating ? (
              <p className="text-sm font-medium text-[var(--review-accent)] sm:hidden">
                Our score: {rating.toFixed(1)}/5
              </p>
            ) : null}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full shrink-0 gap-2 bg-[var(--review-accent)] text-[var(--review-accent-foreground)] hover:bg-[var(--review-accent)]/90 sm:w-auto"
          render={
            <Link
              href={`/api/affiliate/${productId}`}
              rel="nofollow sponsored noopener"
            />
          }
        >
          Check price on Amazon
          <ExternalLink className="size-4" aria-hidden />
        </Button>
      </div>
    </section>
  );
}
