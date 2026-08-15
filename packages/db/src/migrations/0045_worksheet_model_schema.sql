DO $$ BEGIN
 CREATE TYPE "public"."worksheet_layout_template" AS ENUM('pattern_coloring', 'pair_matching', 'group_circling', 'shape_completion', 'count_and_color', 'spot_differences');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "layout_template" "worksheet_layout_template" DEFAULT 'pattern_coloring' NOT NULL;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "content_blocks" jsonb;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "instructions_vi" text;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "learning_objective_ids" jsonb DEFAULT '[]'::jsonb;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "render_job_id" varchar(100);
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "render_status" varchar(50) DEFAULT 'pending';
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "render_input_hash" varchar(64);
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "source_content_version" integer;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "render_page_count" integer;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "render_grayscale_passed" boolean;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "origin" "content_origin" DEFAULT 'human' NOT NULL;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "authored_in" "authored_in" DEFAULT 'studio' NOT NULL;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "seed_batch_id" bigint;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "created_by_manager_id" bigint;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "reviewed_by_manager_id" bigint;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "published_at" timestamp with time zone;
ALTER TABLE "worksheets" ADD COLUMN IF NOT EXISTS "archived_at" timestamp with time zone;

DO $$ BEGIN
 ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_created_by_manager_id_managers_id_fk" FOREIGN KEY ("created_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "worksheets" ADD CONSTRAINT "worksheets_reviewed_by_manager_id_managers_id_fk" FOREIGN KEY ("reviewed_by_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_worksheets_entity_id" ON "worksheets" USING btree ("entity_id");
