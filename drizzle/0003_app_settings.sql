DO $$ BEGIN
  CREATE TYPE "public"."setting_category" AS ENUM(
    'integration',
    'automation',
    'site',
    'security'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."setting_value_type" AS ENUM('string', 'secret', 'boolean');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" varchar(100) NOT NULL,
  "category" "setting_category" NOT NULL,
  "value_type" "setting_value_type" NOT NULL,
  "value_plain" text,
  "value_encrypted" text,
  "encryption_key_id" varchar(50) DEFAULT 'v1' NOT NULL,
  "is_sensitive" boolean DEFAULT false NOT NULL,
  "updated_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "app_settings_key_unique" UNIQUE("key"),
  CONSTRAINT "app_settings_updated_by_admin_users_id_fk"
    FOREIGN KEY ("updated_by") REFERENCES "admin_users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX IF NOT EXISTS "app_settings_category_idx"
  ON "app_settings" ("category");
