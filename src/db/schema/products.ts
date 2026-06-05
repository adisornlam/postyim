import {
  boolean,
  decimal,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { affiliateNetworkEnum, productSyncStatusEnum } from "./enums";
import { campaigns } from "./campaigns";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    categoryId: uuid("category_id").references(() => categories.id),
    affiliateNetwork: affiliateNetworkEnum("affiliate_network").notNull(),
    externalId: varchar("external_id", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    specs: jsonb("specs").default({}),
    rawData: jsonb("raw_data").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    affiliateLink: varchar("affiliate_link", { length: 1000 }).notNull(),
    imageUrl: varchar("image_url", { length: 1000 }),
    duplicateHash: varchar("duplicate_hash", { length: 64 }).notNull().unique(),
    syncStatus: productSyncStatusEnum("sync_status")
      .notNull()
      .default("pending"),
    isActive: boolean("is_active").notNull().default(true),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("products_network_external_id_idx").on(
      table.affiliateNetwork,
      table.externalId,
    ),
  ],
);
