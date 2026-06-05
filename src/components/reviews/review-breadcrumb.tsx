import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { getSiteName } from "@/lib/env";

interface ReviewBreadcrumbProps {
  reviewTitle: string;
}

export function ReviewBreadcrumb({ reviewTitle }: ReviewBreadcrumbProps) {
  const siteName = getSiteName();
  const shortTitle =
    reviewTitle.length > 48 ? `${reviewTitle.slice(0, 48).trim()}…` : reviewTitle;

  return (
    <nav aria-label="Breadcrumb" className="review-breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link href="/" className="transition-colors hover:text-foreground">
            {siteName}
          </Link>
        </li>
        <li aria-hidden className="flex items-center">
          <ChevronRight className="size-3.5 opacity-50" />
        </li>
        <li>
          <Link href="/reviews" className="transition-colors hover:text-foreground">
            Reviews
          </Link>
        </li>
        <li aria-hidden className="flex items-center">
          <ChevronRight className="size-3.5 opacity-50" />
        </li>
        <li>
          <span className="font-medium text-foreground" aria-current="page">
            {shortTitle}
          </span>
        </li>
      </ol>
    </nav>
  );
}
