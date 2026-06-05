import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { logLevelEnum } from "./enums";
import { jobRuns } from "./job-runs";

export const cronLogs = pgTable("cron_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobRunId: uuid("job_run_id")
    .notNull()
    .references(() => jobRuns.id),
  level: logLevelEnum("level").notNull().default("info"),
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
