-- Migration: Drop game_templates table and transition to code-only registry
-- Phase 1 (Expand): Add template_code columns and backfill from game_templates
ALTER TABLE "game_levels" ADD COLUMN IF NOT EXISTS "template_code" varchar(20);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_templates') THEN
    UPDATE "game_levels" gl
    SET "template_code" = gt."code"
    FROM "game_templates" gt
    WHERE gl."template_id" = gt."id" AND gl."template_code" IS NULL;
  END IF;
END $$;

ALTER TABLE "play_sessions" ADD COLUMN IF NOT EXISTS "template_code" varchar(20);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_templates') THEN
    UPDATE "play_sessions" ps
    SET "template_code" = gt."code"
    FROM "game_templates" gt
    WHERE ps."template_id" = gt."id" AND ps."template_code" IS NULL;
  END IF;
END $$;

ALTER TABLE "child_session_summaries" ADD COLUMN IF NOT EXISTS "template_code" varchar(20);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_templates') THEN
    UPDATE "child_session_summaries" css
    SET "template_code" = gt."code"
    FROM "game_templates" gt
    WHERE css."template_id" = gt."id" AND css."template_code" IS NULL;
  END IF;
END $$;

ALTER TABLE "telemetry_events" ADD COLUMN IF NOT EXISTS "template_code" varchar(20);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_templates') THEN
    UPDATE "telemetry_events" te
    SET "template_code" = gt."code"
    FROM "game_templates" gt
    WHERE te."template_id" = gt."id" AND te."template_code" IS NULL;
  END IF;
END $$;

-- Default fallback if any rows still null
UPDATE "game_levels" SET "template_code" = 'GT-001' WHERE "template_code" IS NULL;
UPDATE "play_sessions" SET "template_code" = 'GT-001' WHERE "template_code" IS NULL;
UPDATE "child_session_summaries" SET "template_code" = 'GT-001' WHERE "template_code" IS NULL;

-- Set NOT NULL
ALTER TABLE "game_levels" ALTER COLUMN "template_code" SET NOT NULL;
ALTER TABLE "play_sessions" ALTER COLUMN "template_code" SET NOT NULL;
ALTER TABLE "child_session_summaries" ALTER COLUMN "template_code" SET NOT NULL;

-- Phase 2 (Contract): Drop FK constraints
ALTER TABLE "game_levels" DROP CONSTRAINT IF EXISTS "game_levels_template_id_game_templates_id_fk";
ALTER TABLE "play_sessions" DROP CONSTRAINT IF EXISTS "play_sessions_template_id_game_templates_id_fk";
ALTER TABLE "child_session_summaries" DROP CONSTRAINT IF EXISTS "child_session_summaries_template_id_game_templates_id_fk";

-- Drop old template_id columns
ALTER TABLE "game_levels" DROP COLUMN IF EXISTS "template_id";
ALTER TABLE "play_sessions" DROP COLUMN IF EXISTS "template_id";
ALTER TABLE "child_session_summaries" DROP COLUMN IF EXISTS "template_id";
ALTER TABLE "telemetry_events" DROP COLUMN IF EXISTS "template_id";

-- Drop table game_templates
DROP TABLE IF EXISTS "game_templates";

-- Drop unused enums
DROP TYPE IF EXISTS "game_template_status";
DROP TYPE IF EXISTS "game_template_kind";
