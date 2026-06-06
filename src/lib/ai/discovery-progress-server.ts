import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { cronLogs, jobRuns } from "@/db/schema";
import {
  DISCOVERY_JOB_KIND,
  DISCOVERY_PHASE_PERCENT,
  type DiscoveryLogEntry,
  type DiscoveryPhase,
  type DiscoveryProgressSnapshot,
} from "@/lib/ai/discovery-progress-types";
import { logJobEvent } from "@/lib/jobs/logger";

export { DISCOVERY_JOB_KIND };

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
