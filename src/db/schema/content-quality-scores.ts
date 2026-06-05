import {
  boolean,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { reviews } from "./reviews";

export const contentQualityScores = pgTable("content_quality_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id),
  wordCountScore: integer("word_count_score"),
  uniquenessScore: integer("uniqueness_score"),
  specAccuracyScore: integer("spec_accuracy_score"),
  seoScore: integer("seo_score"),
  overallScore: integer("overall_score"),
  checklist: jsonb("checklist").notNull(),
  passed: boolean("passed").notNull(),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
