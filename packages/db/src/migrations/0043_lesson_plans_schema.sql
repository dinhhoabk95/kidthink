DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_plan_item_type') THEN
    CREATE TYPE "lesson_plan_item_type" AS ENUM('activity', 'game_level', 'custom_note');
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_plans" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"title" varchar(200) NOT NULL,
	"target_age" smallint,
	"estimated_minutes" integer,
	"notes" text,
	"source_lesson_code" varchar(50),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_lesson_plans_target_age" CHECK ("target_age" IS NULL OR ("target_age" >= 3 AND "target_age" <= 6)),
	CONSTRAINT "check_lesson_plans_estimated_minutes" CHECK ("estimated_minutes" IS NULL OR ("estimated_minutes" >= 1 AND "estimated_minutes" <= 180))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_plan_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_plan_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lesson_plan_id" bigint NOT NULL,
	"position" smallint NOT NULL,
	"item_type" "lesson_plan_item_type" NOT NULL,
	"item_code" varchar(50),
	"source_entity_id" bigint,
	"source_content_version" integer,
	"custom_instruction" text,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_plan_items_plan_pos_unique" UNIQUE("lesson_plan_id","position"),
	CONSTRAINT "check_lesson_plan_items_position" CHECK ("position" >= 0)
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_plans_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lesson_plan_items_lesson_plan_id_lesson_plans_id_fk'
  ) THEN
    ALTER TABLE "lesson_plan_items" ADD CONSTRAINT "lesson_plan_items_lesson_plan_id_lesson_plans_id_fk" FOREIGN KEY ("lesson_plan_id") REFERENCES "lesson_plans"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_lesson_plans_uuid" ON "lesson_plans" ("uuid");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_plans_user_id" ON "lesson_plans" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_plans_source_lesson_code" ON "lesson_plans" ("source_lesson_code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_plan_items_plan_id" ON "lesson_plan_items" ("lesson_plan_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lesson_plan_items_source_entity" ON "lesson_plan_items" ("source_entity_id");
