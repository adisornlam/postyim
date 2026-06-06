"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

import {
  DISCOVERY_PHASE_LABELS,
  DISCOVERY_PHASES,
  type DiscoveryLogEntry,
  type DiscoveryPhase,
  type DiscoveryProgressSnapshot,
} from "@/lib/ai/discovery-progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBackdrop,
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type DiscoveryCampaignOption = {
  id: string;
  name: string;
  slug: string;
  keywords: string[];
  categoryName?: string | null;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function DiscoveryConfirmDialog({
  open,
  campaign,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  campaign: DiscoveryCampaignOption | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogHeader>
            <div className="space-y-1 pr-2">
              <DialogTitle>Start product discovery?</DialogTitle>
              <DialogDescription>
                Gemini will search Amazon using your campaign keywords and return
                up to 10 ranked candidates.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {campaign ? (
              <>
                <dl className="space-y-3 rounded-xl border bg-muted/20 p-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Campaign
                    </dt>
                    <dd className="mt-1 font-medium">{campaign.name}</dd>
                  </div>
                  {campaign.categoryName ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Category
                      </dt>
                      <dd className="mt-1">{campaign.categoryName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Seed keywords
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-2">
                      {campaign.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border bg-background px-2.5 py-1 text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Uses Gemini API (billable Google AI usage)</li>
                  <li>Typically takes 1–3 minutes while Google Search runs</li>
                  <li>Nothing is saved until you import a candidate</li>
                  <li>Pre-PA-API workflow — results should be verified before import</li>
                </ul>
              </>
            ) : null}

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={onConfirm}>
                <Sparkles className="size-4" aria-hidden />
                Start discovery
              </Button>
            </div>
          </DialogBody>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

function phaseIndex(phase: DiscoveryPhase) {
  if (phase === "failed") {
    return -1;
  }

  return DISCOVERY_PHASES.indexOf(phase);
}

function PhaseStep({
  label,
  state,
}: {
  label: string;
  state: "done" | "active" | "pending";
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {state === "done" ? (
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden />
      ) : state === "active" ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-[var(--review-accent)]" aria-hidden />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
      )}
      <span
        className={cn(
          state === "active" && "font-medium text-foreground",
          state === "done" && "text-foreground",
          state === "pending" && "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );
}

export function DiscoveryProgressDialog({
  open,
  campaignName,
  progress,
  logs,
  startedAt,
  failed,
  onOpenChange,
}: {
  open: boolean;
  campaignName: string;
  progress: DiscoveryProgressSnapshot | null;
  logs: DiscoveryLogEntry[];
  startedAt: number | null;
  failed: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!open || !startedAt || failed || progress?.phase === "complete") {
      return;
    }

    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [open, startedAt, failed, progress?.phase]);

  const activeIndex = progress ? phaseIndex(progress.phase) : 0;
  const percent = progress?.percent ?? 5;

  const visibleLogs = useMemo(() => logs.slice(-8), [logs]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !failed && progress?.phase !== "complete") {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup className="w-[min(calc(100vw-2rem),640px)]">
          <DialogHeader>
            <div className="space-y-1 pr-2">
              <DialogTitle>
                {failed
                  ? "Discovery failed"
                  : progress?.phase === "complete"
                    ? "Discovery complete"
                    : "Discovering products"}
              </DialogTitle>
              <DialogDescription>
                {campaignName}
                {startedAt ? ` · ${formatElapsed(elapsedMs || Date.now() - startedAt)} elapsed` : ""}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {progress?.message ?? "Starting…"}
                </span>
                <span className="tabular-nums text-muted-foreground">{percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    failed ? "bg-destructive" : "bg-[var(--review-accent)]",
                  )}
                  style={{ width: `${Math.max(percent, failed ? 100 : 4)}%` }}
                />
              </div>
            </div>

            <ol className="grid gap-2 sm:grid-cols-2">
              {DISCOVERY_PHASES.filter((phase) => phase !== "complete").map(
                (phase, index) => {
                  const state =
                    activeIndex > index
                      ? "done"
                      : activeIndex === index
                        ? "active"
                        : "pending";

                  return (
                    <PhaseStep
                      key={phase}
                      label={DISCOVERY_PHASE_LABELS[phase]}
                      state={state}
                    />
                  );
                },
              )}
            </ol>

            {progress?.searchedQueries && progress.searchedQueries.length > 0 ? (
              <div className="rounded-xl border bg-muted/20 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Search angles
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {progress.searchedQueries.slice(0, 4).map((query) => (
                    <li key={query} className="flex items-start gap-2">
                      <Search className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <span>{query}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-xl border">
              <div className="border-b px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Activity log
              </div>
              <ul className="max-h-44 space-y-2 overflow-y-auto p-3 text-sm">
                {visibleLogs.length === 0 ? (
                  <li className="text-muted-foreground">Waiting for worker…</li>
                ) : (
                  visibleLogs.map((log) => (
                    <li key={log.id} className="flex gap-2">
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                      <span
                        className={cn(
                          log.level === "error" && "text-destructive",
                          log.level !== "error" && "text-foreground",
                        )}
                      >
                        {log.message}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {failed || progress?.phase === "complete" ? (
              <div className="flex justify-end border-t pt-4">
                <Button type="button" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Keep this dialog open — discovery continues in the background. You
                can browse other admin pages, but results appear here when ready.
              </p>
            )}
          </DialogBody>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
