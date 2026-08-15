DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_job_kind') THEN
    CREATE TYPE "export_job_kind" AS ENUM('lesson_plan', 'worksheet', 'curriculum_plan');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'export_job_status') THEN
    CREATE TYPE "export_job_status" AS ENUM('queued', 'processing', 'done', 'failed');
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "export_jobs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "export_jobs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"kind" "export_job_kind" NOT NULL,
	"ref_id" varchar(200) NOT NULL,
	"status" "export_job_status" DEFAULT 'queued' NOT NULL,
	"file_path" text,
	"page_count" integer,
	"expires_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_export_jobs_page_count" CHECK ("page_count" IS NULL OR ("page_count" >= 1 AND "page_count" <= 20))
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'export_jobs_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_export_jobs_uuid" ON "export_jobs" ("uuid");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_export_jobs_user_id" ON "export_jobs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_export_jobs_status" ON "export_jobs" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_export_jobs_expires_at" ON "export_jobs" ("expires_at");
