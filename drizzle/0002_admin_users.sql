DO $$ BEGIN
  CREATE TYPE "public"."admin_role" AS ENUM('superadmin', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(320) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "name" varchar(200) NOT NULL,
  "role" "admin_role" DEFAULT 'admin' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
