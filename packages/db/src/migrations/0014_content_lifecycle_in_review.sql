ALTER TYPE "public"."access_tier" ADD VALUE IF NOT EXISTS 'login' AFTER 'free';--> statement-breakpoint
ALTER TYPE "public"."content_lifecycle_status" RENAME VALUE 'submitted' TO 'in_review';--> statement-breakpoint
ALTER TABLE "content_review_log" RENAME COLUMN "action" TO "from_status";--> statement-breakpoint
ALTER TABLE "content_review_log" ALTER COLUMN "from_status" TYPE "public"."content_lifecycle_status" USING 'draft'::"public"."content_lifecycle_status";--> statement-breakpoint
ALTER TABLE "content_review_log" ADD COLUMN "to_status" "public"."content_lifecycle_status" NOT NULL DEFAULT 'in_review';--> statement-breakpoint
ALTER TABLE "content_review_log" ALTER COLUMN "to_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "content_review_log" RENAME COLUMN "reviewer_manager_id" TO "actor_manager_id";--> statement-breakpoint
ALTER TABLE "content_review_log" RENAME COLUMN "review_notes" TO "reason";--> statement-breakpoint
ALTER TABLE "content_review_log" ADD COLUMN "actor_role" "public"."manager_role";--> statement-breakpoint
ALTER TABLE "content_review_log" ADD COLUMN "checklist_snapshot" jsonb;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."review_action";--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_published_game_level_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        RAISE EXCEPTION 'BR-CLC-01/BR-SCT-05: Cannot update published game level version. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_published_content_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        RAISE EXCEPTION 'BR-CLC-01/BR-SCT-05: Cannot update published content version. Create a new version instead.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
