DO $$ BEGIN
 CREATE TYPE "public"."error_source" AS ENUM('server', 'client');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."error_level" AS ENUM('warn', 'error', 'fatal');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."error_group_status" AS ENUM('open', 'ack', 'resolved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "error_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "error_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
	"source" "error_source" DEFAULT 'server' NOT NULL,
	"level" "error_level" DEFAULT 'error' NOT NULL,
	"code" varchar(80) NOT NULL,
	"message" text NOT NULL,
	"fingerprint" varchar(120) NOT NULL,
	"context" jsonb,
	"request_id" varchar(80),
	"user_id" bigint REFERENCES "users"("id") ON DELETE set null,
	"status" "error_group_status" DEFAULT 'open' NOT NULL,
	"resolved_notes" text,
	"resolved_by_manager_id" bigint REFERENCES "managers"("id"),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_error_logs_fingerprint_status" ON "error_logs" USING btree ("fingerprint","status");
CREATE INDEX IF NOT EXISTS "idx_error_logs_created_at" ON "error_logs" USING btree ("created_at");
