import { eq } from "drizzle-orm";

import { db } from "@/db";
import { cronLogs, jobRuns } from "@/db/schema";

type JobType = typeof jobRuns.$inferInsert.jobType;
type JobStatus = typeof jobRuns.$inferInsert.status;
type LogLevel = typeof cronLogs.$inferInsert.level;

export async function startJobRun(input: {
  jobType: JobType;
  campaignId?: string;
}) {
  const [run] = await db
    .insert(jobRuns)
    .values({
      jobType: input.jobType,
      campaignId: input.campaignId,
      status: "running",
      startedAt: new Date(),
    })
    .returning();

  return run;
}

export async function logJobEvent(input: {
  jobRunId: string;
  level?: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(cronLogs).values({
    jobRunId: input.jobRunId,
    level: input.level ?? "info",
    message: input.message,
    metadata: input.metadata,
  });
}

export async function updateJobProgress(input: {
  jobRunId: string;
  itemsProcessed: number;
  itemsFailed: number;
}) {
  await db
    .update(jobRuns)
    .set({
      itemsProcessed: input.itemsProcessed,
      itemsFailed: input.itemsFailed,
    })
    .where(eq(jobRuns.id, input.jobRunId));
}

export async function finishJobRun(input: {
  jobRunId: string;
  status: Exclude<JobStatus, "pending" | "running">;
  itemsProcessed: number;
  itemsFailed: number;
  startedAt: Date;
  errorDetails?: Record<string, unknown>;
}) {
  const durationMs = Date.now() - input.startedAt.getTime();

  await db
    .update(jobRuns)
    .set({
      status: input.status,
      itemsProcessed: input.itemsProcessed,
      itemsFailed: input.itemsFailed,
      durationMs,
      ...(input.errorDetails !== undefined
        ? { errorDetails: input.errorDetails }
        : {}),
      completedAt: new Date(),
    })
    .where(eq(jobRuns.id, input.jobRunId));
}
