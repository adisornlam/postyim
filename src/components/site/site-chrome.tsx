import Link from "next/link";

import { getSiteName } from "@/lib/env";
import { cn } from "@/lib/utils";
import { SiteSearch } from "@/components/site/site-search";

interface SiteChromeProps {
  variant?: "default" | "review";
}

export function SiteHeader({ variant = "default" }: SiteChromeProps) {
  const siteName = getSiteName();
  const isReview = variant === "review";

  return (
    <header
      className={cn(
        "border-b",
        isReview &&
          "sticky top-0 z-50 border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75",
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-3.5 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 lg:gap-4">
          <Link
            href="/"
            className={cn(
              "shrink-0 font-semibold tracking-tight transition-colors hover:text-[var(--review-accent)]",
              isReview
                ? "font-[family-name:var(--font-display)] text-lg"
                : "text-lg",
            )}
          >
            {siteName}
          </Link>

          <SiteSearch className="hidden min-w-0 flex-1 md:block md:max-w-xl lg:max-w-2xl" />

          <nav className="ml-auto flex shrink-0 items-center gap-3 text-sm text-muted-foreground sm:gap-4">
            <Link href="/reviews" className="hover:text-foreground">
              Reviews
            </Link>
            <Link
              href="/disclosure"
              className="hidden hover:text-foreground sm:inline"
            >
              Disclosure
            </Link>
            <Link href="/about" className="hidden hover:text-foreground sm:inline">
              About
            </Link>
            <Link
              href="/search"
              className="hover:text-foreground md:hidden"
              aria-label="Search"
            >
              Search
            </Link>
          </nav>
        </div>

        <SiteSearch className="mt-3 md:hidden" />
      </div>
    </header>
  );
}

export function SiteFooter({ variant = "default" }: SiteChromeProps) {
  const isReview = variant === "review";

  return (
    <footer className={cn("border-t", isReview && "bg-[var(--review-bg)]")}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Postyim. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/disclosure" className="hover:text-foreground">
            Affiliate Disclosure
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
