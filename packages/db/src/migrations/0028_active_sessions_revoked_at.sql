ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp with time zone;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone DEFAULT now() + interval '30 days' NOT NULL;
ALTER TABLE "active_sessions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;
