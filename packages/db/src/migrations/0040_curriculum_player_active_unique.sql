DO $$
BEGIN
  -- Clean up any duplicate active enrollments before creating unique constraint
  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY child_id ORDER BY enrolled_at DESC, id DESC) as rn
    FROM curriculum_enrollments
    WHERE status = 'active'
  )
  UPDATE curriculum_enrollments
  SET status = 'dropped'
  WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
END $$;
--> statement-breakpoint
ALTER TYPE "curriculum_enrollment_status" ADD VALUE IF NOT EXISTS 'withdrawn';
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_curriculum_enrollments_active_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_curriculum_enrollments_child_active_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_curriculum_enrollments_child_active_unique" ON "curriculum_enrollments" ("child_id") WHERE "status" = 'active';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_curriculum_item_progress_enrollment_status" ON "curriculum_item_progress" ("enrollment_id", "status");
