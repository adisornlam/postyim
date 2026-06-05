"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchReviewResult {
  slug: string;
  title: string;
  metaDescription?: string | null;
  rating?: string | null;
  productTitle: string;
  imageUrl?: string | null;
  authorName?: string | null;
  category?: { name: string; slug: string } | null;
}

interface SearchCategoryResult {
  name: string;
  slug: string;
  description?: string | null;
  reviewCount: number;
}

interface SiteSearchProps {
  className?: string;
  inputId?: string;
  autoFocus?: boolean;
  variant?: "header" | "page";
  defaultQuery?: string;
}

export function SiteSearch({
  className,
  inputId,
  autoFocus = false,
  variant = "header",
  defaultQuery = "",
}: SiteSearchProps) {
  const router = useRouter();
  const generatedId = useId();
  const fieldId = inputId ?? generatedId;
  const listboxId = `${fieldId}-listbox`;

  const [query, setQuery] = useState(defaultQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<SearchReviewResult[]>([]);
  const [categories, setCategories] = useState<SearchCategoryResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const displayReviews = canSearch ? reviews : [];
  const displayCategories = canSearch ? categories : [];
  const displayLoading = canSearch && loading;
  const resultCount = displayReviews.length + displayCategories.length;

  const navigateToSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 2) {
        return;
      }

      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [router],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as {
          reviews: SearchReviewResult[];
          categories: SearchCategoryResult[];
        };

        setReviews(data.reviews);
        setCategories(data.categories);
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setReviews([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateToSearch(query);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open || resultCount === 0) {
      if (event.key === "ArrowDown" && canSearch) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % resultCount);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? resultCount - 1 : current - 1,
      );
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const categoryOffset = displayCategories.length;

      if (activeIndex < categoryOffset) {
        const category = displayCategories[activeIndex];
        setOpen(false);
        router.push(`/reviews/category/${category.slug}`);
        return;
      }

      const review = displayReviews[activeIndex - categoryOffset];
      setOpen(false);
      router.push(`/reviews/${review.slug}`);
    }
  }

  const showDropdown = open && canSearch;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor={fieldId} className="sr-only">
          Search reviews
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={fieldId}
            type="search"
            value={query}
            autoFocus={autoFocus}
            autoComplete="off"
            enterKeyHint="search"
            placeholder={
              variant === "page"
                ? "Search desk lamps, chairs, home office..."
                : "Search reviews..."
            }
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            aria-autocomplete="list"
            className={cn(
              "h-10 border-border/80 bg-background pr-10 pl-9 shadow-none",
              variant === "page" && "h-12 text-base",
            )}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (canSearch) {
                setOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : loading ? (
            <Loader2
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>
      </form>

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+0.5rem)] z-50 max-h-[min(24rem,calc(100vh-8rem))] w-full overflow-y-auto rounded-xl border bg-popover p-2 shadow-lg"
        >
          {displayLoading && resultCount === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Searching...
            </p>
          ) : null}

          {!displayLoading && resultCount === 0 ? (
            <div className="px-3 py-4">
              <p className="text-sm font-medium">No matches yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try product names, categories, or topics like desk lamp.
              </p>
            </div>
          ) : null}

          {displayCategories.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Categories
              </p>
              {displayCategories.map((category, index) => (
                <Link
                  key={category.slug}
                  href={`/reviews/category/${category.slug}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "block rounded-lg px-3 py-2 transition-colors hover:bg-muted",
                    activeIndex === index && "bg-muted",
                  )}
                  onClick={() => setOpen(false)}
                >
                  <p className="text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.reviewCount}{" "}
                    {category.reviewCount === 1 ? "review" : "reviews"}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

          {displayReviews.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Reviews
              </p>
              {displayReviews.map((review, index) => {
                const optionIndex = displayCategories.length + index;

                return (
                  <Link
                    key={review.slug}
                    href={`/reviews/${review.slug}`}
                    role="option"
                    aria-selected={activeIndex === optionIndex}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted",
                      activeIndex === optionIndex && "bg-muted",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    {review.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.imageUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-12 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {review.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {review.productTitle}
                        {review.rating ? ` · ${review.rating}/5` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}

          {resultCount > 0 ? (
            <button
              type="button"
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-[var(--review-accent)] hover:bg-muted"
              onClick={() => navigateToSearch(query)}
            >
              View all results for &ldquo;{query.trim()}&rdquo;
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
