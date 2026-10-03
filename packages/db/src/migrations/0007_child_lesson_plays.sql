-- Task #280 — lượt trẻ tự học một bài (docs/specs/04-play/child-lesson-flow.md §7.1)
CREATE TABLE IF NOT EXISTS "child_lesson_plays" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
  "child_profile_id" bigint NOT NULL,
  "lesson_id" bigint NOT NULL,
  "content_version" integer NOT NULL,
  "status" varchar(20) DEFAULT 'in_progress' NOT NULL,
  "steps" jsonb NOT NULL,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "child_lesson_plays_uuid_unique" UNIQUE ("uuid"),
  CONSTRAINT "check_child_lesson_plays_status" CHECK ("status" IN ('in_progress', 'completed')),
  CONSTRAINT "child_lesson_plays_child_profile_id_child_profiles_id_fk"
    FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE cascade,
  CONSTRAINT "child_lesson_plays_lesson_id_lessons_id_fk"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_child_lesson_plays_in_progress"
  ON "child_lesson_plays" ("child_profile_id", "lesson_id")
  WHERE "status" = 'in_progress';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_lesson_plays_child"
  ON "child_lesson_plays" ("child_profile_id");
