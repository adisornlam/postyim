import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { mediaTypeEnum } from "./enums";
import { products } from "./products";

export const mediaAssets = pgTable("media_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  type: mediaTypeEnum("type").notNull().default("image"),
  url: varchar("url", { length: 1000 }).notNull(),
  altText: varchar("alt_text", { length: 300 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
