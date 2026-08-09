CREATE TYPE "public"."child_relationship" AS ENUM('child', 'student', 'other');--> statement-breakpoint
CREATE TYPE "public"."child_status" AS ENUM('active', 'archived', 'pending_deletion');--> statement-breakpoint
ALTER TABLE "child_profiles" ALTER COLUMN "display_name" SET DATA TYPE varchar(40);--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "avatar_id" varchar(24) NOT NULL;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "relationship" "child_relationship";--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "current_curriculum_id" bigint;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "daily_play_cap_minutes" smallint DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "child_profiles" ADD COLUMN "status" "child_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE INDEX "child_profiles_birth_year_idx" ON "child_profiles" USING btree ("birth_year");--> statement-breakpoint
ALTER TABLE "child_profiles" DROP COLUMN "gender";--> statement-breakpoint
ALTER TABLE "child_profiles" DROP COLUMN "avatar_url";--> statement-breakpoint
ALTER TABLE "child_profiles" DROP COLUMN "avatar_emoji";--> statement-breakpoint
ALTER TABLE "child_profiles" DROP COLUMN "theme_preference";--> statement-breakpoint
ALTER TABLE "child_profiles" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "child_profiles" DROP COLUMN "archived_at";--> statement-breakpoint
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_uuid_unique" UNIQUE("uuid");