DO $$
DECLARE
  legacy_row RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activities') THEN
    SELECT code, kind INTO legacy_row FROM activities WHERE kind::text IN ('hands_on', 'story', 'song', 'art', 'reflection', 'custom') LIMIT 1;
    IF FOUND THEN
      RAISE EXCEPTION 'MIGRATION_FAILED: Legacy activity kind % found on code %. Manual classification required.', legacy_row.kind, legacy_row.code;
    END IF;
  END IF;
END $$;
--> statement-breakpoint
CREATE TYPE "public"."activity_kind_new" AS ENUM(
  'digital_game',
  'discussion',
  'storytelling',
  'movement',
  'manipulative',
  'worksheet',
  'observation',
  'mini_project',
  'assessment',
  'home_activity'
);
--> statement-breakpoint
ALTER TABLE "activities" ALTER COLUMN "kind" TYPE "public"."activity_kind_new" USING ("kind"::text::"public"."activity_kind_new");
--> statement-breakpoint
DROP TYPE "public"."activity_kind";
--> statement-breakpoint
ALTER TYPE "public"."activity_kind_new" RENAME TO "activity_kind";
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "materials_vi" text;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "origin" "public"."content_origin" NOT NULL DEFAULT 'human';
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "authored_in" "public"."authored_in" NOT NULL DEFAULT 'studio';
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "seed_batch_id" bigint;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "created_by_manager_id" bigint REFERENCES "public"."managers"("id");
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "reviewed_by_manager_id" bigint REFERENCES "public"."managers"("id");
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_activities_entity_id" ON "activities" ("entity_id");
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_activities_estimated_minutes'
  ) THEN
    ALTER TABLE "activities" ADD CONSTRAINT "check_activities_estimated_minutes" CHECK ("estimated_minutes" >= 2 AND "estimated_minutes" <= 20);
  END IF;
END $$;
