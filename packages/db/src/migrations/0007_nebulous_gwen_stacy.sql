CREATE TYPE "public"."activity_kind" AS ENUM('digital_game', 'worksheet', 'hands_on', 'story', 'discussion', 'movement', 'song', 'art', 'reflection', 'custom');--> statement-breakpoint
CREATE TYPE "public"."image_owner_type" AS ENUM('game_level', 'lesson', 'activity', 'worksheet', 'user_avatar', 'manager_avatar');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "activities_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"kind" "activity_kind" NOT NULL,
	"title_vi" varchar(200) NOT NULL,
	"instruction_vi" text,
	"estimated_minutes" integer,
	"ref_type" varchar(50),
	"ref_id" bigint,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_activities_code_format" CHECK ("activities"."code" ~ '^ACT-\d{4}$')
);
--> statement-breakpoint
CREATE TABLE "content_images" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"owner_type" "image_owner_type" NOT NULL,
	"owner_id" bigint NOT NULL,
	"storage_path" text NOT NULL,
	"alt_text_vi" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_activities" (
	"lesson_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"activity_id" bigint NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	CONSTRAINT "lesson_activities_lesson_id_position_pk" PRIMARY KEY("lesson_id","position")
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lessons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"title_vi" varchar(200) NOT NULL,
	"guide_vi" text,
	"target_age_min" smallint,
	"target_age_max" smallint,
	"estimated_minutes" integer,
	"materials_vi" text,
	"warm_up_vi" text,
	"reflection_vi" text,
	"assessment_vi" text,
	"extension_vi" text,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'studio' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_lessons_code_format" CHECK ("lessons"."code" ~ '^LES-\d{4}$'),
	CONSTRAINT "check_lessons_estimated_minutes" CHECK ("lessons"."estimated_minutes" >= 5 AND "lessons"."estimated_minutes" <= 45)
);
--> statement-breakpoint
CREATE TABLE "worksheets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "worksheets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"title_vi" varchar(200) NOT NULL,
	"pdf_path" text,
	"preview_path" text,
	"access_tier" "access_tier" NOT NULL,
	"status" "content_lifecycle_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worksheets_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_worksheets_code_format" CHECK ("worksheets"."code" ~ '^WS-\d{4}$')
);
--> statement-breakpoint
ALTER TABLE "lesson_activities" ADD CONSTRAINT "lesson_activities_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_activities_published_code" ON "activities" USING btree ("code") WHERE "activities"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_lessons_published_code" ON "lessons" USING btree ("code") WHERE "lessons"."status" = 'published';--> statement-breakpoint
CREATE UNIQUE INDEX "idx_worksheets_published_code" ON "worksheets" USING btree ("code") WHERE "worksheets"."status" = 'published';--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_published_content_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        RAISE EXCEPTION 'BR-SCT-05: Cannot update published content version. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_lessons_update
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_activities_update
BEFORE UPDATE ON activities
FOR EACH ROW
EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_worksheets_update
BEFORE UPDATE ON worksheets
FOR EACH ROW
EXECUTE FUNCTION prevent_published_content_update();--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;