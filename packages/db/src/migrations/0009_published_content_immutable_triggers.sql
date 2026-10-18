CREATE OR REPLACE FUNCTION prevent_published_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' THEN
    IF NEW.status = 'archived' AND
       (to_jsonb(NEW) - 'status' - 'archived_at' - 'updated_at') =
       (to_jsonb(OLD) - 'status' - 'archived_at' - 'updated_at') THEN
      RETURN NEW;
    END IF;
    IF TG_TABLE_NAME = 'lessons' AND NEW.status = 'published' AND
       (to_jsonb(NEW) - 'is_exemplar' - 'exemplar_competency' - 'exemplar_age_band' - 'exemplar_approved_by_id' - 'exemplar_approved_at' - 'updated_at') =
       (to_jsonb(OLD) - 'is_exemplar' - 'exemplar_competency' - 'exemplar_age_band' - 'exemplar_approved_by_id' - 'exemplar_approved_at' - 'updated_at') AND
       (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'BR-CLC-01 / BR-SCT-05: Cannot update published content';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevent_published_content_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' THEN
    IF NEW.status = 'archived' AND
       (to_jsonb(NEW) - 'status' - 'archived_at' - 'updated_at') =
       (to_jsonb(OLD) - 'status' - 'archived_at' - 'updated_at') THEN
      RETURN NEW;
    END IF;
    IF TG_TABLE_NAME = 'lessons' AND NEW.status = 'published' AND
       (to_jsonb(NEW) - 'is_exemplar' - 'exemplar_competency' - 'exemplar_age_band' - 'exemplar_approved_by_id' - 'exemplar_approved_at' - 'updated_at') =
       (to_jsonb(OLD) - 'is_exemplar' - 'exemplar_competency' - 'exemplar_age_band' - 'exemplar_approved_by_id' - 'exemplar_approved_at' - 'updated_at') AND
       (to_jsonb(NEW) - 'updated_at') IS DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'BR-CLC-01 / BR-SCT-05: Cannot update published content';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_prevent_published_game_levels
  BEFORE UPDATE ON game_levels
  FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

CREATE OR REPLACE TRIGGER trg_prevent_published_lessons
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

CREATE OR REPLACE TRIGGER trg_prevent_published_activities
  BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

CREATE OR REPLACE TRIGGER trg_prevent_published_curricula
  BEFORE UPDATE ON curricula
  FOR EACH ROW EXECUTE FUNCTION prevent_published_update();

CREATE OR REPLACE TRIGGER trg_prevent_published_worksheets
  BEFORE UPDATE ON worksheets
  FOR EACH ROW EXECUTE FUNCTION prevent_published_update();
