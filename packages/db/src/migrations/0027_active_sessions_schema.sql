ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "device_id" varchar(64) DEFAULT 'unknown' NOT NULL;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "remembered" boolean DEFAULT false NOT NULL;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "device_label" text;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "ip_address" text;
DO $$ BEGIN
  CREATE TYPE "public"."auth_method" AS ENUM('password', 'magic_link', 'passkey', 'totp', 'oauth_google', 'oauth_apple', 'oauth_facebook', 'oauth_zalo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "auth_method" "auth_method" DEFAULT 'password' NOT NULL;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "last_used_at" timestamp with time zone;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone DEFAULT now() + interval '30 days' NOT NULL;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;

