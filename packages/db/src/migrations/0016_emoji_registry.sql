DO $$ BEGIN
 CREATE TYPE "public"."emoji_age_suitability" AS ENUM('all', '4plus');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."emoji_status" AS ENUM('active', 'deprecated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "emoji_registry" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
	"code" varchar(50) NOT NULL UNIQUE,
	"unicode" varchar(20) NOT NULL,
	"name_vi" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"search_keywords_vi" text[],
	"age_suitability" "emoji_age_suitability" DEFAULT 'all' NOT NULL,
	"what_axis" varchar(50),
	"status" "emoji_status" DEFAULT 'active' NOT NULL,
	CONSTRAINT "check_emoji_registry_code_format" CHECK ("emoji_registry"."code" ~ '^EMJ-[a-z0-9-]+$')
);
