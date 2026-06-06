import { eq } from "drizzle-orm";

import { db } from "@/db";
import { jobRuns } from "@/db/schema";
import {
  discoverProductsForCampaign,
  type DiscoverProductsInput,
  type DiscoverProductsOutput,
} from "@/lib/ai/discover-products";
import {
  DISCOVERY_JOB_KIND,
  getDiscoveryJobLogs,
  reportDiscoveryProgress,
} from "@/lib/ai/discovery-progress-server";
import {
  resolveDiscoveryProgress,
  type DiscoveryProgressSnapshot,
} from "@/lib/ai/discovery-progress-types";
import { getSiteUrl } from "@/lib/env";
import {
  finishJobRun,
  logJobEvent,
  startJobRun,
} from "@/lib/jobs/logger";
import { getCronSecret } from "@/lib/settings/runtime-config";

export { DISCOVERY_JOB_KIND } from "@/lib/ai/discovery-progress-server";

export type DiscoveryJobDetails = {
  kind: typeof DISCOVERY_JOB_KIND;
  input: DiscoverProductsInput;
  output?: DiscoverProductsOutput;
  error?: string;
  progress?: DiscoveryProgressSnapshot;
};

export async function createDiscoveryJobRun(input: DiscoverProductsInput) {
  const run = await startJobRun({
    jobType: "product_ingestion",
    campaignId: input.campaignId,
  });

  await db
    .update(jobRuns)
    .set({
      status: "pending",
      errorDetails: {
        kind: DISCOVERY_JOB_KIND,
        input,
      } satisfies DiscoveryJobDetails,
    })
    .where(eq(jobRuns.id, run.id));

  return run;
}

export async function triggerDiscoveryJobRun(jobRunId: string) {
  const baseUrl = getSiteUrl();
  const secret = await getCronSecret();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  const response = await fetch(`${baseUrl}/api/admin/products/discover/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobRunId }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Failed to start discovery worker (${response.status})`,
    );
  }
}

export function startDiscoveryJobRun(jobRunId: string) {
  void runDiscoveryJobRun(jobRunId);
}

export async function runDiscoveryJobRun(jobRunId: string) {
  const [run] = await db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.id, jobRunId))
    .limit(1);

  if (!run) {
    throw new Error("Discovery job not found.");
  }

  const details = run.errorDetails as DiscoveryJobDetails | null;

  if (!details || details.kind !== DISCOVERY_JOB_KIND || !details.input) {
    throw new Error("Invalid discovery job payload.");
  }

  if (run.status === "completed") {
    return details.output ?? null;
  }

  const startedAt = run.startedAt ?? new Date();

  await db
    .update(jobRuns)
    .set({ status: "running", startedAt })
    .where(eq(jobRuns.id, jobRunId));

  await logJobEvent({
    jobRunId,
    message: "Product discovery started",
    metadata: { campaignId: details.input.campaignId },
  });

  try {
    const output = await discoverProductsForCampaign({
      ...details.input,
      jobRunId,
    });

    await reportDiscoveryProgress(jobRunId, {
      phase: "complete",
      message: `Found ${output.result.candidates.length} candidate${output.result.candidates.length === 1 ? "" : "s"}`,
      searchedQueries: output.result.searchedQueries,
      candidateCount: output.result.candidates.length,
    });

    await db
      .update(jobRuns)
      .set({
        errorDetails: {
          kind: DISCOVERY_JOB_KIND,
          input: details.input,
          output,
          progress: {
            phase: "complete",
            percent: 100,
            message: `Found ${output.result.candidates.length} candidate${output.result.candidates.length === 1 ? "" : "s"}`,
            searchedQueries: output.result.searchedQueries,
            candidateCount: output.result.candidates.length,
          },
        } satisfies DiscoveryJobDetails,
      })
      .where(eq(jobRuns.id, jobRunId));

    await finishJobRun({
      jobRunId,
      status: "completed",
      itemsProcessed: output.result.candidates.length,
      itemsFailed: 0,
      startedAt,
    });

    await logJobEvent({
      jobRunId,
      message: "Product discovery completed",
      metadata: {
        mode: output.mode,
        candidates: output.result.candidates.length,
      },
    });

    return output;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product discovery failed";

    const [freshRun] = await db
      .select({ errorDetails: jobRuns.errorDetails })
      .from(jobRuns)
      .where(eq(jobRuns.id, jobRunId))
      .limit(1);

    const freshDetails = freshRun?.errorDetails as DiscoveryJobDetails | null;
    const lastProgress = freshDetails?.progress;

    await db
      .update(jobRuns)
      .set({
        errorDetails: {
          kind: DISCOVERY_JOB_KIND,
          input: details.input,
          error: message,
          progress: lastProgress ?? {
            phase: "search",
            percent: 45,
            message,
          },
        } satisfies DiscoveryJobDetails,
      })
      .where(eq(jobRuns.id, jobRunId));

    await finishJobRun({
      jobRunId,
      status: "failed",
      itemsProcessed: 0,
      itemsFailed: 1,
      startedAt,
    });

    await logJobEvent({
      jobRunId,
      level: "error",
      message: "Product discovery failed",
      metadata: { error: message },
    });

    throw error;
  }
}

export async function getDiscoveryJobStatus(jobRunId: string) {
  const [run] = await db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.id, jobRunId))
    .limit(1);

  if (!run) {
    return null;
  }

  const details = run.errorDetails as DiscoveryJobDetails | null;

  if (!details || details.kind !== DISCOVERY_JOB_KIND) {
    return {
      jobRunId: run.id,
      status: run.status,
      durationMs: run.durationMs,
      output: undefined,
      error:
        "Discovery job metadata is missing or invalid. Start a new discovery run.",
      progress: {
        phase: "failed",
        percent: 0,
        message: "Discovery job metadata is missing or invalid.",
      },
      logs: [],
      invalid: true as const,
    };
  }

  const logs = await getDiscoveryJobLogs(jobRunId);
  const progress = resolveDiscoveryProgress({
    state: run.status,
    logs,
    storedProgress: details.progress,
    error: details.error,
  });

  return {
    jobRunId: run.id,
    status: run.status,
    durationMs: run.durationMs,
    output: details.output,
    error: details.error,
    progress,
    logs,
  };
}
