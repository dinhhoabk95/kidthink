DO $$ BEGIN
 CREATE TYPE "public"."flag_scope" AS ENUM('global', 'user_ids', 'percentage');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "feature_flags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "feature_flags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key" varchar(100) NOT NULL UNIQUE,
	"enabled" boolean DEFAULT false NOT NULL,
	"scope" "flag_scope" DEFAULT 'global' NOT NULL,
	"scope_value" jsonb,
	"default_value" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_by_manager_id" bigint REFERENCES "managers"("id"),
	"update_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
