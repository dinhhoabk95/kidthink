CREATE TYPE "public"."actor_type" AS ENUM('user', 'manager', 'system');--> statement-breakpoint
CREATE TYPE "public"."backup_status" AS ENUM('started', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."backup_type" AS ENUM('database', 'storage');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('email', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('queued', 'dispatched', 'failed');--> statement-breakpoint
CREATE TYPE "public"."recipient_type" AS ENUM('user', 'manager');--> statement-breakpoint
CREATE TYPE "public"."review_action" AS ENUM('submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."review_entity_type" AS ENUM('game_level', 'lesson', 'activity', 'curriculum', 'worksheet');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" bigint NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"changes" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_logs_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "backup_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "backup_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"backup_type" "backup_type" NOT NULL,
	"status" "backup_status" NOT NULL,
	"size_bytes" bigint,
	"storage_path" text,
	"checksum" varchar(64),
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_review_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_review_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_type" "review_entity_type" NOT NULL,
	"entity_id" bigint NOT NULL,
	"content_version" integer NOT NULL,
	"action" "review_action" NOT NULL,
	"reviewer_manager_id" bigint,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"recipient_type" "recipient_type" NOT NULL,
	"recipient_id" bigint NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"template_code" varchar(60) NOT NULL,
	"payload" jsonb,
	"status" "notification_status" DEFAULT 'queued' NOT NULL,
	"dispatched_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_review_log" ADD CONSTRAINT "content_review_log_reviewer_manager_id_managers_id_fk" FOREIGN KEY ("reviewer_manager_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_created" ON "audit_logs" USING btree ("actor_type","actor_id","created_at");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON consent_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_logs FROM kidthink_app;--> statement-breakpoint
REVOKE UPDATE, DELETE ON content_review_log FROM kidthink_app;