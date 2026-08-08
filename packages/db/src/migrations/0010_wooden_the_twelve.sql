CREATE TABLE "child_daily_stats" (
	"child_profile_id" bigint NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_play_time_seconds" integer DEFAULT 0 NOT NULL,
	"levels_attempted" integer DEFAULT 0 NOT NULL,
	"levels_completed" integer DEFAULT 0 NOT NULL,
	"stars_earned" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_daily_stats_child_profile_id_date_pk" PRIMARY KEY("child_profile_id","date")
);
--> statement-breakpoint
CREATE TABLE "level_daily_stats" (
	"game_level_id" bigint NOT NULL,
	"date" varchar(10) NOT NULL,
	"plays_count" integer DEFAULT 0 NOT NULL,
	"completions_count" integer DEFAULT 0 NOT NULL,
	"avg_duration_seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_daily_stats_game_level_id_date_pk" PRIMARY KEY("game_level_id","date")
);
--> statement-breakpoint
CREATE TABLE "play_sessions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "play_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"session_uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"child_profile_id" bigint,
	"guest_device_id" varchar(100),
	"game_level_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"template_id" bigint NOT NULL,
	"completion_status" varchar(20) DEFAULT 'in_progress' NOT NULL,
	"stars_earned" smallint DEFAULT 0,
	"score" integer DEFAULT 0,
	"duration_seconds" integer DEFAULT 0,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_play_sessions_identity" CHECK ("play_sessions"."child_profile_id" IS NOT NULL OR "play_sessions"."guest_device_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "skill_daily_stats" (
	"skill_id" bigint NOT NULL,
	"date" varchar(10) NOT NULL,
	"practice_count" integer DEFAULT 0 NOT NULL,
	"avg_mastery" smallint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_daily_stats_skill_id_date_pk" PRIMARY KEY("skill_id","date")
);
--> statement-breakpoint
CREATE TABLE "telemetry_events" (
	"session_uuid" uuid NOT NULL,
	"seq" integer NOT NULL,
	"event_name" varchar(100) NOT NULL,
	"payload" jsonb,
	"client_timestamp" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telemetry_events_session_uuid_seq_pk" PRIMARY KEY("session_uuid","seq")
);
--> statement-breakpoint
ALTER TABLE "child_daily_stats" ADD CONSTRAINT "child_daily_stats_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_daily_stats" ADD CONSTRAINT "level_daily_stats_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_template_id_game_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."game_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_daily_stats" ADD CONSTRAINT "skill_daily_stats_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_completed_play_session_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.completion_status = 'completed' THEN
        RAISE EXCEPTION 'BR-SPT-07: Cannot update play session after completion.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER trigger_prevent_completed_play_session_update
BEFORE UPDATE ON play_sessions
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_play_session_update();--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON telemetry_events FROM kidthink_app;