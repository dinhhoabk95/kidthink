CREATE TYPE "public"."lesson_run_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."lesson_step_kind" AS ENUM('warm_up', 'off_screen', 'digital_game', 'reflection', 'assessment');--> statement-breakpoint
CREATE TYPE "public"."lesson_step_outcome" AS ENUM('pending', 'done', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."observation_level" AS ENUM('did_it', 'with_help', 'not_yet');--> statement-breakpoint
CREATE TABLE "lesson_run_observations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_run_observations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lesson_run_id" bigint NOT NULL,
	"objective_code" varchar(50) NOT NULL,
	"level" "observation_level" NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_run_obs_run_obj_unique" UNIQUE("lesson_run_id","objective_code")
);
--> statement-breakpoint
CREATE TABLE "lesson_run_steps" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_run_steps_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"lesson_run_id" bigint NOT NULL,
	"step_index" integer NOT NULL,
	"activity_id" bigint,
	"kind" "lesson_step_kind" NOT NULL,
	"outcome" "lesson_step_outcome" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_run_steps_run_step_unique" UNIQUE("lesson_run_id","step_index")
);
--> statement-breakpoint
CREATE TABLE "lesson_runs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lesson_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" varchar(36) DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"child_profile_id" bigint NOT NULL,
	"lesson_id" bigint NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"status" "lesson_run_status" DEFAULT 'in_progress' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_runs_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
ALTER TABLE "lesson_run_observations" ADD CONSTRAINT "lesson_run_observations_lesson_run_id_lesson_runs_id_fk" FOREIGN KEY ("lesson_run_id") REFERENCES "public"."lesson_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_run_steps" ADD CONSTRAINT "lesson_run_steps_lesson_run_id_lesson_runs_id_fk" FOREIGN KEY ("lesson_run_id") REFERENCES "public"."lesson_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_run_steps" ADD CONSTRAINT "lesson_run_steps_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_runs" ADD CONSTRAINT "lesson_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_runs" ADD CONSTRAINT "lesson_runs_child_profile_id_child_profiles_id_fk" FOREIGN KEY ("child_profile_id") REFERENCES "public"."child_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_runs" ADD CONSTRAINT "lesson_runs_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lesson_runs_user_child" ON "lesson_runs" USING btree ("user_id","child_profile_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_runs_lesson" ON "lesson_runs" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "idx_lesson_runs_status" ON "lesson_runs" USING btree ("status");