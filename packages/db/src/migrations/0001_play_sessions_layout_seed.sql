ALTER TABLE "play_sessions" ADD COLUMN IF NOT EXISTS "layout_seed" bigint;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_play_sessions_layout_seed'
  ) THEN
    ALTER TABLE "play_sessions" ADD CONSTRAINT "check_play_sessions_layout_seed" CHECK ("play_sessions"."layout_seed" IS NULL OR ("play_sessions"."layout_seed" >= 0 AND "play_sessions"."layout_seed" <= 4294967295));
  END IF;
END $$;
