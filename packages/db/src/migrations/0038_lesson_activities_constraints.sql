DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_activities_lesson_activity_unique'
  ) THEN
    ALTER TABLE "lesson_activities" ADD CONSTRAINT "lesson_activities_lesson_activity_unique" UNIQUE ("lesson_id", "activity_id");
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_activities_activity_id" ON "lesson_activities" ("activity_id");
