-- Create custom game status enum
DO $$ BEGIN
 CREATE TYPE "public"."custom_game_status" AS ENUM('draft', 'ready');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create custom_games table
CREATE TABLE IF NOT EXISTS "custom_games" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "custom_games_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"template_id" varchar(32) NOT NULL,
	"title" varchar(200) NOT NULL,
	"instruction" text NOT NULL,
	"content_pack" jsonb NOT NULL,
	"difficulty_params" jsonb NOT NULL,
	"theme_id" varchar(50) DEFAULT 'farm' NOT NULL,
	"age_min" smallint DEFAULT 3 NOT NULL,
	"age_max" smallint DEFAULT 6 NOT NULL,
	"skill_ids" jsonb,
	"status" "custom_game_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_custom_games_age_range" CHECK ("age_min" <= "age_max" AND "age_min" >= 3 AND "age_max" <= 6),
	CONSTRAINT "custom_games_uuid_unique" UNIQUE("uuid")
);

CREATE INDEX IF NOT EXISTS "idx_custom_games_user_status" ON "custom_games" USING btree ("user_id","status");
CREATE INDEX IF NOT EXISTS "idx_custom_games_user_template" ON "custom_games" USING btree ("user_id","template_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_custom_games_uuid" ON "custom_games" USING btree ("uuid");
