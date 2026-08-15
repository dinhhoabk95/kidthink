-- Fix content_images updated_at
ALTER TABLE "content_images" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now() NOT NULL;

-- Create personal curriculum status enum
DO $$ BEGIN
 CREATE TYPE "public"."personal_curriculum_status" AS ENUM('draft', 'ready');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create personal_curricula table
CREATE TABLE IF NOT EXISTS "personal_curricula" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curricula_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"title" varchar(200) NOT NULL,
	"age_min" smallint,
	"age_max" smallint,
	"duration_weeks" smallint DEFAULT 8 NOT NULL,
	"sessions_per_week" smallint DEFAULT 3 NOT NULL,
	"status" "personal_curriculum_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_personal_curricula_age_range" CHECK ("age_min" IS NULL OR "age_max" IS NULL OR "age_min" <= "age_max"),
	CONSTRAINT "check_personal_curricula_duration" CHECK ("duration_weeks" > 0),
	CONSTRAINT "check_personal_curricula_sessions" CHECK ("sessions_per_week" > 0),
	CONSTRAINT "personal_curricula_uuid_unique" UNIQUE("uuid")
);

CREATE INDEX IF NOT EXISTS "idx_personal_curricula_user_id" ON "personal_curricula" USING btree ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_personal_curricula_uuid" ON "personal_curricula" USING btree ("uuid");

-- Create personal_curriculum_items table
CREATE TABLE IF NOT EXISTS "personal_curriculum_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curriculum_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"personal_curriculum_id" bigint NOT NULL REFERENCES "personal_curricula"("id") ON DELETE cascade,
	"week_no" smallint NOT NULL,
	"session_no" smallint NOT NULL,
	"position" smallint NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" bigint NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_curriculum_items_week_session_pos_unique" UNIQUE("personal_curriculum_id","week_no","session_no","position")
);

CREATE INDEX IF NOT EXISTS "idx_personal_curriculum_items_curriculum_week" ON "personal_curriculum_items" USING btree ("personal_curriculum_id","week_no");
CREATE INDEX IF NOT EXISTS "idx_personal_curriculum_items_entity_id" ON "personal_curriculum_items" USING btree ("entity_id");

-- Create personal_curriculum_enrollments table
CREATE TABLE IF NOT EXISTS "personal_curriculum_enrollments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curriculum_enrollments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"child_id" bigint NOT NULL REFERENCES "child_profiles"("id") ON DELETE cascade,
	"personal_curriculum_id" bigint NOT NULL REFERENCES "personal_curricula"("id") ON DELETE cascade,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "curriculum_enrollment_status" DEFAULT 'active' NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_personal_curriculum_enrollments_child_active_unique" ON "personal_curriculum_enrollments" USING btree ("child_id") WHERE ("status" = 'active');
CREATE INDEX IF NOT EXISTS "idx_personal_curriculum_enrollments_child_id" ON "personal_curriculum_enrollments" USING btree ("child_id");
CREATE INDEX IF NOT EXISTS "idx_personal_curriculum_enrollments_curriculum_id" ON "personal_curriculum_enrollments" USING btree ("personal_curriculum_id");

-- Create personal_curriculum_item_progress table
CREATE TABLE IF NOT EXISTS "personal_curriculum_item_progress" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_curriculum_item_progress_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"enrollment_id" bigint NOT NULL REFERENCES "personal_curriculum_enrollments"("id") ON DELETE cascade,
	"child_id" bigint NOT NULL REFERENCES "child_profiles"("id") ON DELETE cascade,
	"personal_curriculum_item_id" bigint NOT NULL REFERENCES "personal_curriculum_items"("id") ON DELETE cascade,
	"status" "curriculum_progress_status" DEFAULT 'not_started' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personal_curriculum_item_progress_enrollment_item_unique" UNIQUE("enrollment_id","personal_curriculum_item_id")
);

CREATE INDEX IF NOT EXISTS "idx_personal_curriculum_item_progress_child_id" ON "personal_curriculum_item_progress" USING btree ("child_id");
CREATE INDEX IF NOT EXISTS "idx_personal_curriculum_item_progress_status" ON "personal_curriculum_item_progress" USING btree ("enrollment_id","status");
