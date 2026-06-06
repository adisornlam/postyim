"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Search, Sparkles } from "lucide-react";

import type { DiscoveryCandidate } from "@/lib/ai/discovery-types";
import type {
  DiscoveryLogEntry,
  DiscoveryProgressSnapshot,
} from "@/lib/ai/discovery-progress";
import {
  DiscoveryConfirmDialog,
  DiscoveryProgressDialog,
  type DiscoveryCampaignOption,
} from "@/components/admin/product-discovery-modals";
import { commissionRateLabel } from "@/lib/affiliate/amazon-commission-rates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type DiscoveryResponse = {
  status: "ok";
  mode: "live" | "mock";
  model?: string;
  campaignName: string;
  result: {
    summary: string;
    searchedQueries: string[];
    candidates: DiscoveryCandidate[];
  };
  error?: string;
};

type DiscoveryAcceptedResponse = {
  status: "accepted";
  jobRunId: string;
  message?: string;
};

type DiscoveryStatusResponse = {
  status: "ok";
  job: {
    jobRunId: string;
    state: "pending" | "running" | "completed" | "failed" | "cancelled";
    durationMs?: number | null;
    output?: Omit<DiscoveryResponse, "status">;
    error?: string;
    progress?: DiscoveryProgressSnapshot;
    logs?: DiscoveryLogEntry[];
  };
  error?: string;
};

const DISCOVERY_POLL_MS = 2000;
const DISCOVERY_POLL_TIMEOUT_MS = 5 * 60 * 1000;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollDiscoveryJob(
  jobRunId: string,
  onUpdate: (job: DiscoveryStatusResponse["job"]) => void,
): Promise<DiscoveryResponse> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < DISCOVERY_POLL_TIMEOUT_MS) {
    const response = await fetch(
      `/api/admin/products/discover/status?jobRunId=${jobRunId}`,
      { cache: "no-store" },
    );

    const data = (await response.json()) as DiscoveryStatusResponse & {
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? "Failed to check discovery status");
    }

    onUpdate(data.job);

    if (data.job.state === "completed" && data.job.output) {
      return { status: "ok", ...data.job.output } as DiscoveryResponse;
    }

    if (data.job.state === "failed") {
      throw new Error(data.job.error ?? "Product discovery failed");
    }

    await sleep(DISCOVERY_POLL_MS);
  }

  throw new Error(
    "Discovery is taking longer than expected. Check Admin → Job logs and try again.",
  );
}

export function ProductDiscoveryPanel({
  campaigns,
}: {
  campaigns: DiscoveryCampaignOption[];
}) {
  const router = useRouter();
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progressFailed, setProgressFailed] = useState(false);
  const [progress, setProgress] = useState<DiscoveryProgressSnapshot | null>(null);
  const [progressLogs, setProgressLogs] = useState<DiscoveryLogEntry[]>([]);
  const [progressStartedAt, setProgressStartedAt] = useState<number | null>(null);
  const [importingAsin, setImportingAsin] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);

  const selectedCampaign = useMemo(
    () => campaigns.find((campaign) => campaign.id === campaignId) ?? null,
    [campaigns, campaignId],
  );

  function openConfirmDialog() {
    if (!campaignId) {
      return;
    }

    setError(null);
    setConfirmOpen(true);
  }

  async function startDiscovery() {
    if (!campaignId) {
      return;
    }

    setConfirmOpen(false);
    setRunning(true);
    setProgressFailed(false);
    setProgress(null);
    setProgressLogs([]);
    setProgressStartedAt(Date.now());
    setProgressOpen(true);
    setError(null);
    setDiscovery(null);

    try {
      const response = await fetch("/api/admin/products/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, limit: 10 }),
      });

      const data = (await response.json()) as
        | DiscoveryResponse
        | DiscoveryAcceptedResponse
        & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Discovery failed");
      }

      if (response.status === 202 && data.status === "accepted") {
        setProgress({
          phase: "prepare",
          percent: 5,
          message: data.message ?? "Discovery worker started…",
        });

        const result = await pollDiscoveryJob(data.jobRunId, (job) => {
          setProgress(job.progress ?? null);
          setProgressLogs(job.logs ?? []);
        });

        setDiscovery(result);
        setProgress({
          phase: "complete",
          percent: 100,
          message: `Found ${result.result.candidates.length} candidate${result.result.candidates.length === 1 ? "" : "s"}`,
          searchedQueries: result.result.searchedQueries,
          candidateCount: result.result.candidates.length,
        });
        return;
      }

      if (data.status === "ok") {
        setProgressOpen(false);
        setDiscovery(data as DiscoveryResponse);
        return;
      }

      throw new Error("Unexpected discovery response");
    } catch (discoverError) {
      const message =
        discoverError instanceof Error
          ? discoverError.message
          : "Discovery failed";

      setProgressFailed(true);
      setProgress({
        phase: "failed",
        percent: 0,
        message,
      });
      setError(message);
    } finally {
      setRunning(false);
    }
  }

  async function handleImport(candidate: DiscoveryCandidate) {
    setImportingAsin(candidate.asin);
    setError(null);

    try {
      const response = await fetch("/api/admin/products/import-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, candidate }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Import failed",
      );
    } finally {
      setImportingAsin(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="discovery-campaign">Campaign</Label>
          <select
            id="discovery-campaign"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            value={campaignId}
            onChange={(event) => setCampaignId(event.target.value)}
            disabled={running}
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Gemini searches Amazon using campaign keywords, scores demand +
            commission fit, and returns up to 10 review candidates.
          </p>
        </div>

        <Button
          type="button"
          disabled={running || !campaignId}
          onClick={openConfirmDialog}
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Search className="size-4" aria-hidden />
          )}
          {running ? "Discovering…" : "Discover products"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DiscoveryConfirmDialog
        open={confirmOpen}
        campaign={selectedCampaign}
        onOpenChange={setConfirmOpen}
        onConfirm={startDiscovery}
      />

      <DiscoveryProgressDialog
        open={progressOpen}
        campaignName={selectedCampaign?.name ?? "Campaign"}
        progress={progress}
        logs={progressLogs}
        startedAt={progressStartedAt}
        failed={progressFailed}
        onOpenChange={setProgressOpen}
      />

      {discovery ? (
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/20 p-4 text-sm leading-relaxed text-muted-foreground">
            <p>{discovery.result.summary}</p>
            <p className="mt-2 text-xs">
              Mode: {discovery.mode}
              {discovery.model ? ` · ${discovery.model}` : ""}
              {discovery.result.searchedQueries.length > 0 ? (
                <>
                  {" "}
                  · Queries: {discovery.result.searchedQueries.slice(0, 3).join("; ")}
                </>
              ) : null}
            </p>
          </div>

          {discovery.result.candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No new candidates found. All results may already be in your catalog.
            </p>
          ) : (
            <div className="space-y-3">
              {discovery.result.candidates.map((candidate) => (
                <article
                  key={candidate.asin}
                  className="rounded-2xl border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Score {candidate.overallScore}</Badge>
                        <Badge variant="outline">{candidate.asin}</Badge>
                        {candidate.price ? (
                          <Badge variant="outline">
                            ${candidate.price} {candidate.currency}
                          </Badge>
                        ) : null}
                        <Badge variant="outline">
                          ~{commissionRateLabel(candidate.estimatedCommissionRate)} est.
                        </Badge>
                      </div>

                      <h3 className="font-medium leading-snug">{candidate.title}</h3>

                      <p className="text-sm text-muted-foreground">
                        Target keyword:{" "}
                        <span className="font-medium text-foreground">
                          {candidate.targetKeyword}
                        </span>
                      </p>

                      <p className="text-sm leading-relaxed">{candidate.rationale}</p>

                      <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {candidate.demandSignals.map((signal) => (
                          <li
                            key={signal}
                            className="rounded-full border px-2.5 py-1"
                          >
                            {signal}
                          </li>
                        ))}
                      </ul>

                      {candidate.risks.length > 0 ? (
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Risks: {candidate.risks.join(" · ")}
                        </p>
                      ) : null}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0"
                      disabled={importingAsin === candidate.asin}
                      onClick={() => handleImport(candidate)}
                    >
                      {importingAsin === candidate.asin ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Sparkles className="size-3.5" aria-hidden />
                      )}
                      {importingAsin === candidate.asin
                        ? "Importing..."
                        : "Import & generate later"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
