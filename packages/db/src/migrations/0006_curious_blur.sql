CREATE TYPE "public"."access_tier" AS ENUM('free', 'standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."authored_in" AS ENUM('repo_seed', 'studio');--> statement-breakpoint
CREATE TYPE "public"."content_lifecycle_status" AS ENUM('draft', 'submitted', 'approved', 'published', 'archived', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."content_origin" AS ENUM('human', 'ai_assisted');--> statement-breakpoint
CREATE TYPE "public"."game_template_status" AS ENUM('active', 'deprecated');--> statement-breakpoint
CREATE TABLE "game_levels" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_levels_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_id" bigint NOT NULL,
	"code" varchar(50) NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"template_id" bigint NOT NULL,
	"title_vi" varchar(200) NOT NULL,
	"description_vi" text,
	"instruction_vi" text,
	"instruction_audio_path" text,
	"content_pack" jsonb NOT NULL,
	"difficulty_params" jsonb NOT NULL,
	"theme_id" varchar(50),
	"age_min" smallint,
	"age_max" smallint,
	"difficulty" smallint,
	"access_tier" "access_tier" NOT NULL,
	"thumbnail_emoji" varchar(50),
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
	CONSTRAINT "game_levels_code_version_unique" UNIQUE("code","content_version"),
	CONSTRAINT "check_game_levels_code_format" CHECK ("game_levels"."code" ~ '^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$')
);
--> statement-breakpoint
CREATE TABLE "game_templates" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "game_templates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(20) NOT NULL,
	"name_vi" varchar(100) NOT NULL,
	"mechanic" varchar(50) NOT NULL,
	"layouts" text[],
	"content_contract" jsonb,
	"difficulty_contract" jsonb,
	"limits" jsonb,
	"age_min" smallint,
	"age_max" smallint,
	"banned_age_bands" text[],
	"requires_tap_fallback" boolean DEFAULT false,
	"asset_kinds" text[],
	"scoring" jsonb,
	"events" text[],
	"engine_session" text,
	"status" "game_template_status" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_templates_code_unique" UNIQUE("code"),
	CONSTRAINT "check_game_templates_code_format" CHECK ("game_templates"."code" ~ '^GT-\d{3}$')
);
--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_game_levels_published_code" ON "game_levels" USING btree ("code") WHERE "game_levels"."status" = 'published';--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_published_game_level_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        RAISE EXCEPTION 'BR-SCT-05: Cannot update published game level version. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_game_level_update
BEFORE UPDATE ON game_levels
FOR EACH ROW
EXECUTE FUNCTION prevent_published_game_level_update();--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;