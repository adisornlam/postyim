import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { jobStatusEnum, jobTypeEnum } from "./enums";
import { campaigns } from "./campaigns";

export const jobRuns = pgTable("job_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobType: jobTypeEnum("job_type").notNull(),
  campaignId: uuid("campaign_id").references(() => campaigns.id),
  status: jobStatusEnum("status").notNull().default("pending"),
  itemsProcessed: integer("items_processed").notNull().default(0),
  itemsFailed: integer("items_failed").notNull().default(0),
  durationMs: integer("duration_ms"),
  errorDetails: jsonb("error_details"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
