DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'action_suggestion_kind') THEN
    CREATE TYPE "action_suggestion_kind" AS ENUM('home_activity', 'in_app');
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_action_suggestions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skill_action_suggestions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"skill_id" bigint NOT NULL,
	"order_no" smallint DEFAULT 1 NOT NULL,
	"text_vi" text NOT NULL,
	"kind" "action_suggestion_kind" DEFAULT 'home_activity' NOT NULL,
	"ref_entity_id" bigint,
	"status" "content_lifecycle_status" DEFAULT 'published' NOT NULL,
	"origin" "content_origin" DEFAULT 'human' NOT NULL,
	"authored_in" "authored_in" DEFAULT 'repo_seed' NOT NULL,
	"seed_batch_id" bigint,
	"created_by_manager_id" bigint,
	"reviewed_by_manager_id" bigint,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_action_suggestions_skill_order_unique" UNIQUE("skill_id","order_no")
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skill_action_suggestions_skill_id_skills_id_fk'
  ) THEN
    ALTER TABLE "skill_action_suggestions" ADD CONSTRAINT "skill_action_suggestions_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skill_action_suggestions_created_by_manager_id_managers_id_fk'
  ) THEN
    ALTER TABLE "skill_action_suggestions" ADD CONSTRAINT "skill_action_suggestions_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "managers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'skill_action_suggestions_reviewed_by_manager_id_managers_id_fk'
  ) THEN
    ALTER TABLE "skill_action_suggestions" ADD CONSTRAINT "skill_action_suggestions_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "managers"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_skill_action_suggestions_skill_id" ON "skill_action_suggestions" ("skill_id");
