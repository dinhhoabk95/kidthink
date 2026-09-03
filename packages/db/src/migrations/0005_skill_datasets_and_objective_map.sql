-- Migration 0005: Task #207 (M3)
-- 1. Enum skill_dataset_surface & Bảng skill_datasets (BR-SDS-01..09)
-- 2. Enum content_entity_type cho content_tag_map & content_skill_map (BR-SCT-08)
-- 3. Bảng content_objective_map (BR-SDS-15)
-- 4. Cột skill_dataset_id & projection_ref trên game_levels

CREATE TYPE "public"."skill_dataset_surface" AS ENUM('game', 'worksheet');
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "skill_datasets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skill_datasets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"code" varchar(50) NOT NULL,
	"skill_id" bigint NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"concept_label" varchar(200) NOT NULL,
	"surface" "skill_dataset_surface" DEFAULT 'game' NOT NULL,
	"items" jsonb NOT NULL,
	"relations" jsonb,
	"ordering" jsonb,
	"axes" jsonb,
	"ladder" jsonb,
	"phrasing" jsonb,
	"extends_skill_code" varchar(50),
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"seed_batch_id" bigint,
	"origin" varchar(50) DEFAULT 'human' NOT NULL,
	"authored_in" varchar(50) DEFAULT 'repo_seed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_datasets_code_unique" UNIQUE("code"),
	CONSTRAINT "check_skill_datasets_code_format" CHECK ("code" ~ '^C[1-6]\.[A-Z]{2,5}\.\d{2}$')
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "skill_datasets" ADD CONSTRAINT "skill_datasets_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "game_levels" ADD COLUMN IF NOT EXISTS "skill_dataset_id" bigint;
--> statement-breakpoint
ALTER TABLE "game_levels" ADD COLUMN IF NOT EXISTS "projection_ref" varchar(100);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "game_levels" ADD CONSTRAINT "game_levels_skill_dataset_id_skill_datasets_id_fk" FOREIGN KEY ("skill_dataset_id") REFERENCES "public"."skill_datasets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."content_entity_type" AS ENUM('game_level', 'lesson', 'activity', 'curriculum', 'worksheet');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "content_tag_map" ALTER COLUMN "entity_type" TYPE "content_entity_type" USING "entity_type"::"content_entity_type";
--> statement-breakpoint
ALTER TABLE "content_skill_map" ALTER COLUMN "entity_type" TYPE "content_entity_type" USING "entity_type"::"content_entity_type";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "content_objective_map" (
	"entity_type" "content_entity_type" NOT NULL,
	"entity_id" bigint NOT NULL,
	"learning_objective_id" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_objective_map_entity_type_entity_id_learning_objective_id_pk" PRIMARY KEY("entity_type","entity_id","learning_objective_id")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "content_objective_map" ADD CONSTRAINT "content_objective_map_learning_objective_id_learning_objectives_id_fk" FOREIGN KEY ("learning_objective_id") REFERENCES "public"."learning_objectives"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
