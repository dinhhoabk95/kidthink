DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_type') THEN
    CREATE TYPE "program_type" AS ENUM ('age_based', 'journey');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curriculum_enrollment_status') THEN
    CREATE TYPE "curriculum_enrollment_status" AS ENUM ('active', 'completed', 'paused', 'dropped');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'curriculum_progress_status') THEN
    CREATE TYPE "curriculum_progress_status" AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
  END IF;
END $$;
--> statement-breakpoint

ALTER TABLE "curricula" ADD COLUMN IF NOT EXISTS "program_type" "program_type" DEFAULT 'age_based' NOT NULL;
--> statement-breakpoint
ALTER TABLE "curricula" ADD COLUMN IF NOT EXISTS "target_age_min" smallint;
--> statement-breakpoint
ALTER TABLE "curricula" ADD COLUMN IF NOT EXISTS "target_age_max" smallint;
--> statement-breakpoint
ALTER TABLE "curricula" ADD COLUMN IF NOT EXISTS "duration_weeks" smallint DEFAULT 8 NOT NULL;
--> statement-breakpoint
ALTER TABLE "curricula" ADD COLUMN IF NOT EXISTS "sessions_per_week" smallint DEFAULT 3 NOT NULL;
--> statement-breakpoint

ALTER TABLE "curricula" DROP CONSTRAINT IF EXISTS "check_curricula_code_format";
--> statement-breakpoint
ALTER TABLE "curricula" ADD CONSTRAINT "check_curricula_code_format" CHECK ("code" ~ '^CUR-[A-Za-z0-9_-]+$');
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "curriculum_weeks" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "curriculum_id" bigint NOT NULL REFERENCES "curricula"("id") ON DELETE CASCADE,
  "week_no" smallint NOT NULL,
  "goal" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "curriculum_weeks_curriculum_id_week_no_unique" UNIQUE ("curriculum_id", "week_no")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_curriculum_weeks_curriculum_id" ON "curriculum_weeks" ("curriculum_id");
--> statement-breakpoint

ALTER TABLE "curriculum_items" ADD COLUMN IF NOT EXISTS "week_no" smallint;
--> statement-breakpoint
ALTER TABLE "curriculum_items" ADD COLUMN IF NOT EXISTS "session_no" smallint;
--> statement-breakpoint
ALTER TABLE "curriculum_items" ADD COLUMN IF NOT EXISTS "is_required" boolean DEFAULT true NOT NULL;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curriculum_items' AND column_name = 'is_optional') THEN
    UPDATE "curriculum_items" SET "is_required" = NOT "is_optional" WHERE "is_required" IS NULL;
    ALTER TABLE "curriculum_items" DROP COLUMN "is_optional";
  END IF;
END $$;
--> statement-breakpoint

UPDATE "curriculum_items" SET "week_no" = 1 WHERE "week_no" IS NULL;
--> statement-breakpoint
UPDATE "curriculum_items" SET "session_no" = 1 WHERE "session_no" IS NULL;
--> statement-breakpoint
ALTER TABLE "curriculum_items" ALTER COLUMN "week_no" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "curriculum_items" ALTER COLUMN "session_no" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "curriculum_items" ALTER COLUMN "position" TYPE smallint;
--> statement-breakpoint

ALTER TABLE "curriculum_items" DROP CONSTRAINT IF EXISTS "curriculum_items_curriculum_id_position_unique";
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_items_curriculum_week_session_pos_unique'
  ) THEN
    ALTER TABLE "curriculum_items" ADD CONSTRAINT "curriculum_items_curriculum_week_session_pos_unique" UNIQUE ("curriculum_id", "week_no", "session_no", "position");
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_curriculum_items_curriculum_week" ON "curriculum_items" ("curriculum_id", "week_no");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_curriculum_items_entity_id" ON "curriculum_items" ("entity_id");
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_enrollments_child_id_child_profiles_id_fk'
  ) THEN
    ALTER TABLE "curriculum_enrollments" ADD CONSTRAINT "curriculum_enrollments_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curriculum_enrollments' AND column_name = 'status' AND udt_name = 'varchar') THEN
    ALTER TABLE "curriculum_enrollments" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "curriculum_enrollments" ALTER COLUMN "status" TYPE "curriculum_enrollment_status" USING "status"::"curriculum_enrollment_status";
    ALTER TABLE "curriculum_enrollments" ALTER COLUMN "status" SET DEFAULT 'active';
  END IF;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_curriculum_enrollments_active_unique" ON "curriculum_enrollments" ("child_id", "curriculum_id") WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_curriculum_enrollments_child_id" ON "curriculum_enrollments" ("child_id");
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_item_progress_child_id_child_profiles_id_fk'
  ) THEN
    ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'curriculum_item_progress_enrollment_item_unique'
  ) THEN
    ALTER TABLE "curriculum_item_progress" ADD CONSTRAINT "curriculum_item_progress_enrollment_item_unique" UNIQUE ("enrollment_id", "curriculum_item_id");
  END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curriculum_item_progress' AND column_name = 'status' AND udt_name = 'varchar') THEN
    ALTER TABLE "curriculum_item_progress" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "curriculum_item_progress" ALTER COLUMN "status" TYPE "curriculum_progress_status" USING "status"::"curriculum_progress_status";
    ALTER TABLE "curriculum_item_progress" ALTER COLUMN "status" SET DEFAULT 'not_started';
  END IF;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_curriculum_item_progress_child_id" ON "curriculum_item_progress" ("child_id");
