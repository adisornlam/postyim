import {
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { reviewStatusEnum } from "./enums";
import { authors } from "./authors";
import { tsvector } from "./custom-types";
import { keywords } from "./keywords";
import { products } from "./products";

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .unique()
    .references(() => products.id),
  authorId: uuid("author_id").references(() => authors.id),
  keywordId: uuid("keyword_id").references(() => keywords.id),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  metaDescription: varchar("meta_description", { length: 320 }),
  searchVector: tsvector("search_vector"),
  content: text("content").notNull(),
  pros: jsonb("pros").default([]),
  cons: jsonb("cons").default([]),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  status: reviewStatusEnum("status").notNull().default("draft"),
  canonicalUrl: varchar("canonical_url", { length: 500 }),
  wordCount: integer("word_count"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
