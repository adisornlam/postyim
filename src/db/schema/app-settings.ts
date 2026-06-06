import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { adminUsers } from "./admin-users";

export const settingCategoryEnum = pgEnum("setting_category", [
  "integration",
  "automation",
  "site",
  "security",
]);

export const settingValueTypeEnum = pgEnum("setting_value_type", [
  "string",
  "secret",
  "boolean",
]);

export const appSettings = pgTable("app_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  category: settingCategoryEnum("category").notNull(),
  valueType: settingValueTypeEnum("value_type").notNull(),
  valuePlain: text("value_plain"),
  valueEncrypted: text("value_encrypted"),
  encryptionKeyId: varchar("encryption_key_id", { length: 50 })
    .notNull()
    .default("v1"),
  isSensitive: boolean("is_sensitive").notNull().default(false),
  updatedBy: uuid("updated_by").references(() => adminUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
