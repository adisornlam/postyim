import {
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { reviews } from "./reviews";

export const reviewVersions = pgTable(
  "review_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id),
    versionNumber: integer("version_number").notNull(),
    content: text("content").notNull(),
    title: varchar("title", { length: 300 }),
    metaDescription: varchar("meta_description", { length: 320 }),
    pros: jsonb("pros"),
    cons: jsonb("cons"),
    rating: decimal("rating", { precision: 2, scale: 1 }),
    changeReason: varchar("change_reason", { length: 200 }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("review_versions_review_version_idx").on(
      table.reviewId,
      table.versionNumber,
    ),
  ],
);
