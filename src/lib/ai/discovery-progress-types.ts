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

function lastProgressFromLogs(
  logs: DiscoveryLogEntry[],
): DiscoveryLogEntry | undefined {
  return [...logs]
    .reverse()
    .find(
      (log) =>
        typeof log.percent === "number" &&
        log.phase &&
        log.phase !== "failed" &&
        log.phase !== "complete",
    );
}

export function resolveDiscoveryProgress(input: {
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  logs: DiscoveryLogEntry[];
  storedProgress?: DiscoveryProgressSnapshot | null;
  error?: string;
}): DiscoveryProgressSnapshot {
  if (input.state === "failed") {
    const lastLog = lastProgressFromLogs(input.logs);
    const lastPhase =
      input.storedProgress?.phase ??
      lastLog?.phase ??
      "search";
    const lastPercent =
      input.storedProgress?.percent ??
      lastLog?.percent ??
      DISCOVERY_PHASE_PERCENT[
        lastPhase === "failed" || lastPhase === "complete"
          ? "search"
          : lastPhase
      ];

    return {
      phase: "failed",
      percent: lastPercent,
      message: input.error ?? "Discovery failed",
      searchedQueries: input.storedProgress?.searchedQueries,
      candidateCount: input.storedProgress?.candidateCount,
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
