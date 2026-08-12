ALTER TABLE "play_sessions" ADD COLUMN IF NOT EXISTS "is_preview" boolean DEFAULT false NOT NULL;
ALTER TABLE "play_sessions" ADD COLUMN IF NOT EXISTS "access_tier_at_start" varchar(20);

CREATE OR REPLACE FUNCTION prevent_completed_play_session_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.completion_status IN ('completed', 'abandoned') THEN
        RAISE EXCEPTION 'BR-SPT-07: Cannot update play session after completion or abandonment.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_completed_play_session_update ON "play_sessions";
CREATE TRIGGER trigger_prevent_completed_play_session_update
  BEFORE UPDATE ON "play_sessions"
  FOR EACH ROW
  EXECUTE FUNCTION prevent_completed_play_session_update();
