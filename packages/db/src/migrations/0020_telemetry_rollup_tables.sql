DROP TABLE IF EXISTS "child_session_summaries" CASCADE;
CREATE TABLE "child_session_summaries" (
	"child_profile_id" bigint NOT NULL,
	"session_uuid" uuid NOT NULL,
	"game_level_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"template_id" bigint NOT NULL,
	"completion_status" varchar(20) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"stars_earned" smallint DEFAULT 0 NOT NULL,
	"hints_used" integer DEFAULT 0 NOT NULL,
	"retries_count" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_session_summaries_child_profile_id_session_uuid_pk" PRIMARY KEY("child_profile_id","session_uuid")
);

DO $$ BEGIN
  ALTER TABLE "child_session_summaries" ADD CONSTRAINT "child_session_summaries_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "child_session_summaries" ADD CONSTRAINT "child_session_summaries_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "child_session_summaries" ADD CONSTRAINT "child_session_summaries_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "child_daily_stats" RENAME COLUMN "date" TO "date_ict";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

ALTER TABLE "child_daily_stats" ADD COLUMN IF NOT EXISTS "sessions_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "child_daily_stats" ADD COLUMN IF NOT EXISTS "skills_touched" integer DEFAULT 0 NOT NULL;

DROP TABLE IF EXISTS "level_daily_stats" CASCADE;
CREATE TABLE "level_daily_stats" (
	"level_code" varchar(40) NOT NULL,
	"content_version" integer NOT NULL,
	"date_ict" varchar(10) NOT NULL,
	"plays_count" integer DEFAULT 0 NOT NULL,
	"completions_count" integer DEFAULT 0 NOT NULL,
	"abandoned_count" integer DEFAULT 0 NOT NULL,
	"avg_duration_seconds" integer DEFAULT 0 NOT NULL,
	"avg_hints_used" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_daily_stats_level_code_content_version_date_ict_pk" PRIMARY KEY("level_code","content_version","date_ict")
);

DO $$ BEGIN
  ALTER TABLE "skill_daily_stats" RENAME COLUMN "date" TO "date_ict";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "skill_daily_stats" RENAME COLUMN "practice_count" TO "exposure_count";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "skill_daily_stats" RENAME COLUMN "avg_mastery" TO "avg_accuracy_percent";
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

ALTER TABLE "skill_daily_stats" ALTER COLUMN "avg_accuracy_percent" SET DATA TYPE integer;
