import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HomeHero() {
  return (
    <section className="home-hero flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
          The best gear, tested and reviewed
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Clear picks, real pros and cons, and prices you can act on.
        </p>
      </div>

      <Button
        size="lg"
        className="w-fit shrink-0 gap-2 bg-[var(--review-accent)] text-[var(--review-accent-foreground)] hover:bg-[var(--review-accent)]/90"
        render={<Link href="/reviews" />}
      >
        All reviews
        <ArrowRight className="size-4" aria-hidden />
      </Button>
    </section>
  );
}
