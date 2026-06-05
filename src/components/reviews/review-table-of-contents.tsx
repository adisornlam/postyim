"use client";

import { useState } from "react";
import { List } from "lucide-react";

interface ReviewTableOfContentsProps {
  headings: Array<{ id: string; text: string }>;
}

export function ReviewTableOfContents({ headings }: ReviewTableOfContentsProps) {
  const [open, setOpen] = useState(false);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents" className="review-toc">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-left lg:pointer-events-none lg:cursor-default lg:border-0 lg:bg-transparent lg:p-0"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.14em]">
          <List className="size-4 lg:hidden" aria-hidden />
          In this review
        </span>
        <span className="text-xs text-muted-foreground lg:hidden">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <ol
        className={`mt-3 space-y-2 border-l border-[var(--review-accent)]/30 pl-4 ${open ? "block" : "hidden"} lg:block`}
      >
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="block py-1 text-sm text-muted-foreground transition-colors hover:text-[var(--review-accent)]"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
