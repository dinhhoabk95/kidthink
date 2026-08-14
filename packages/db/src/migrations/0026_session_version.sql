ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;
ALTER TABLE "managers" ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;
