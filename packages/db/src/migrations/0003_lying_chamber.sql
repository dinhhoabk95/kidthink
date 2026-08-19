ALTER TABLE "lessons" ADD COLUMN "is_exemplar" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "exemplar_competency" varchar(10);--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "exemplar_age_band" varchar(10);--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "exemplar_approved_by_id" bigint;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "exemplar_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_exemplar_approved_by_id_managers_id_fk" FOREIGN KEY ("exemplar_approved_by_id") REFERENCES "public"."managers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_lessons_exemplar" ON "lessons" USING btree ("is_exemplar","exemplar_competency","exemplar_age_band") WHERE "lessons"."is_exemplar" = true;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "check_lessons_exemplar_competency" CHECK ("lessons"."exemplar_competency" IS NULL OR "lessons"."exemplar_competency" ~ '^C[1-6]$');--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "check_lessons_exemplar_age_band" CHECK ("lessons"."exemplar_age_band" IS NULL OR "lessons"."exemplar_age_band" IN ('3-4', '4-5', '5-6'));--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "check_lessons_exemplar_invariants" CHECK (("lessons"."is_exemplar" = false) OR ("lessons"."is_exemplar" = true AND "lessons"."exemplar_competency" IS NOT NULL AND "lessons"."exemplar_age_band" IS NOT NULL AND "lessons"."exemplar_approved_by_id" IS NOT NULL AND "lessons"."access_tier" = 'free' AND "lessons"."origin" = 'human'));--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_published_lesson_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'published' AND NEW.status = 'published' THEN
        -- Cho phép cập nhật cờ và metadata duyệt mẫu (BR-LEX-01, BR-LEX-10) mà không sửa nội dung bài học
        IF (
            OLD.entity_id = NEW.entity_id AND
            OLD.code = NEW.code AND
            OLD.content_version = NEW.content_version AND
            OLD.title = NEW.title AND
            OLD.guide IS NOT DISTINCT FROM NEW.guide AND
            OLD.access_tier = NEW.access_tier AND
            OLD.origin = NEW.origin AND
            OLD.authored_in = NEW.authored_in
        ) THEN
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'BR-CLC-01/BR-SCT-05: Cannot update published content version. Create a new version instead.';
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
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS trigger_prevent_published_lessons_update ON "lessons";--> statement-breakpoint
CREATE TRIGGER trigger_prevent_published_lessons_update
  BEFORE UPDATE ON "lessons"
  FOR EACH ROW EXECUTE FUNCTION prevent_published_lesson_update();