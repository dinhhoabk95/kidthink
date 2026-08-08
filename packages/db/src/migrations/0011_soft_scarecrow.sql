CREATE TABLE "level_params" (
	"child_profile_id" bigint NOT NULL,
	"game_level_id" bigint NOT NULL,
	"param_overrides" jsonb,
	"adaptive_factor" numeric(5, 4) DEFAULT '1.0000' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "level_params_child_profile_id_game_level_id_pk" PRIMARY KEY("child_profile_id","game_level_id")
);
--> statement-breakpoint
CREATE TABLE "mastery_state" (
	"child_profile_id" bigint NOT NULL,
	"skill_id" bigint NOT NULL,
	"p_learn" numeric(5, 4) DEFAULT '0.1000' NOT NULL,
	"p_guess" numeric(5, 4) DEFAULT '0.2000' NOT NULL,
	"p_slip" numeric(5, 4) DEFAULT '0.1000' NOT NULL,
	"p_transit" numeric(5, 4) DEFAULT '0.1000' NOT NULL,
	"ema_correct" numeric(5, 4) DEFAULT '0.5000' NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"last_practiced_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mastery_state_child_profile_id_skill_id_pk" PRIMARY KEY("child_profile_id","skill_id"),
	CONSTRAINT "check_mastery_state_p_learn" CHECK ("mastery_state"."p_learn" >= 0 AND "mastery_state"."p_learn" <= 1),
	CONSTRAINT "check_mastery_state_ema_correct" CHECK ("mastery_state"."ema_correct" >= 0 AND "mastery_state"."ema_correct" <= 1)
);
--> statement-breakpoint
ALTER TABLE "level_params" ADD CONSTRAINT "level_params_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "level_params" ADD CONSTRAINT "level_params_game_level_id_game_levels_id_fk" FOREIGN KEY ("game_level_id") REFERENCES "public"."game_levels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "mastery_state_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_state" ADD CONSTRAINT "mastery_state_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON telemetry_events FROM kidthink_app;