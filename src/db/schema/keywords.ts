import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { keywordDifficultyEnum, keywordIntentEnum } from "./enums";

export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyword: varchar("keyword", { length: 300 }).notNull().unique(),
  intent: keywordIntentEnum("intent").notNull().default("commercial"),
  searchVolume: integer("search_volume"),
  difficulty: keywordDifficultyEnum("difficulty"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
