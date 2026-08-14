DO $$ BEGIN
 CREATE TYPE "public"."consent_action" AS ENUM('accepted', 'withdrawn');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "consent_logs" ADD COLUMN IF NOT EXISTS "action" "public"."consent_action" DEFAULT 'accepted' NOT NULL;
--> statement-breakpoint
ALTER TABLE "consent_logs" DROP COLUMN IF EXISTS "policy_version";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consent_requirements" (
	"consent_type" "public"."consent_type" PRIMARY KEY NOT NULL,
	"reconsent_required_at" timestamp with time zone,
	"notice_vi" varchar(500),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;
