import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { cronLogs, jobRuns } from "@/db/schema";
import { logJobEvent } from "@/lib/jobs/logger";

export const DISCOVERY_JOB_KIND = "product_discovery";

export const DISCOVERY_PHASES = [
  "prepare",
  "search",
  "structure",
  "finalize",
  "complete",
] as const;

export type DiscoveryPhase =
  | (typeof DISCOVERY_PHASES)[number]
  | "failed";

export const DISCOVERY_PHASE_LABELS: Record<
  Exclude<DiscoveryPhase, "failed">,
  string
> = {
  prepare: "Prepare campaign",
  search: "Search Amazon",
  structure: "Structure candidates",
  finalize: "Score and filter",
  complete: "Complete",
};

export const DISCOVERY_PHASE_PERCENT: Record<DiscoveryPhase, number> = {
  prepare: 10,
  search: 45,
  structure: 75,
  finalize: 90,
  complete: 100,
  failed: 0,
};

export type DiscoveryProgressSnapshot = {
  phase: DiscoveryPhase;
  percent: number;
  message: string;
  searchedQueries?: string[];
  candidateCount?: number;
};

export type DiscoveryLogEntry = {
  id: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  phase?: DiscoveryPhase;
  percent?: number;
  createdAt: string;
};

export async function logDiscoveryProgress(input: {
  jobRunId: string;
  phase: DiscoveryPhase;
  message: string;
  searchedQueries?: string[];
  candidateCount?: number;
  level?: "debug" | "info" | "warn" | "error";
}) {
  const percent = DISCOVERY_PHASE_PERCENT[input.phase];

  await logJobEvent({
    jobRunId: input.jobRunId,
    level: input.level ?? "info",
    message: input.message,
    metadata: {
      phase: input.phase,
      percent,
      searchedQueries: input.searchedQueries,
      candidateCount: input.candidateCount,
    },
  });
}

export async function persistDiscoveryJobProgress(
  jobRunId: string,
  progress: DiscoveryProgressSnapshot,
) {
  const [run] = await db
    .select({ errorDetails: jobRuns.errorDetails })
    .from(jobRuns)
    .where(eq(jobRuns.id, jobRunId))
    .limit(1);

  if (!run) {
    return;
  }

  const details = run.errorDetails as Record<string, unknown> | null;

  if (!details || details.kind !== DISCOVERY_JOB_KIND) {
    return;
  }

  await db
    .update(jobRuns)
    .set({
      errorDetails: {
        ...details,
        progress,
      },
    })
    .where(eq(jobRuns.id, jobRunId));
}

export async function reportDiscoveryProgress(
  jobRunId: string | undefined,
  input: {
    phase: DiscoveryPhase;
    message: string;
    searchedQueries?: string[];
    candidateCount?: number;
    level?: "debug" | "info" | "warn" | "error";
  },
) {
  if (!jobRunId) {
    return;
  }

  const progress: DiscoveryProgressSnapshot = {
    phase: input.phase,
    percent: DISCOVERY_PHASE_PERCENT[input.phase],
    message: input.message,
    searchedQueries: input.searchedQueries,
    candidateCount: input.candidateCount,
  };

  await logDiscoveryProgress({
    jobRunId,
    phase: input.phase,
    message: input.message,
    searchedQueries: input.searchedQueries,
    candidateCount: input.candidateCount,
    level: input.level,
  });
  await persistDiscoveryJobProgress(jobRunId, progress);
}

export async function getDiscoveryJobLogs(
  jobRunId: string,
): Promise<DiscoveryLogEntry[]> {
  const rows = await db
    .select()
    .from(cronLogs)
    .where(eq(cronLogs.jobRunId, jobRunId))
    .orderBy(asc(cronLogs.createdAt));

  return rows.map((row) => {
    const metadata = row.metadata as {
      phase?: DiscoveryPhase;
      percent?: number;
    } | null;

    return {
      id: row.id,
      level: row.level,
      message: row.message,
      phase: metadata?.phase,
      percent: metadata?.percent,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export function resolveDiscoveryProgress(input: {
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  logs: DiscoveryLogEntry[];
  storedProgress?: DiscoveryProgressSnapshot | null;
  error?: string;
}): DiscoveryProgressSnapshot {
  if (input.state === "failed") {
    return {
      phase: "failed",
      percent: 0,
      message: input.error ?? "Discovery failed",
    };
  }

  if (input.state === "completed") {
    return {
      phase: "complete",
      percent: 100,
      message:
        input.storedProgress?.message ??
        input.logs.at(-1)?.message ??
        "Discovery complete",
      candidateCount: input.storedProgress?.candidateCount,
      searchedQueries: input.storedProgress?.searchedQueries,
    };
  }

  const progressLogs = [...input.logs]
    .reverse()
    .find((log) => typeof log.percent === "number");

  if (progressLogs?.phase && typeof progressLogs.percent === "number") {
    return {
      phase: progressLogs.phase,
      percent: progressLogs.percent,
      message: progressLogs.message,
    };
  }

  if (input.storedProgress) {
    return input.storedProgress;
  }

  if (input.state === "pending") {
    return {
      phase: "prepare",
      percent: 5,
      message: "Queued — starting discovery worker…",
    };
  }

  return {
    phase: "search",
    percent: 20,
    message: "Running discovery…",
  };
}
