import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { affiliateNetworkEnum, campaignStatusEnum } from "./enums";
import { categories } from "./categories";

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  categoryId: uuid("category_id").references(() => categories.id),
  affiliateNetwork: affiliateNetworkEnum("affiliate_network")
    .notNull()
    .default("amazon"),
  status: campaignStatusEnum("status").notNull().default("active"),
  keywords: jsonb("keywords").notNull().default([]),
  config: jsonb("config").default({}),
  dailyProductLimit: integer("daily_product_limit").notNull().default(10),
  priority: integer("priority").notNull().default(0),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
