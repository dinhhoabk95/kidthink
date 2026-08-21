-- Migration: game_level_rounds table (Task #100 WP100.2)
-- Expand phase: create child table and copy existing level data as round_index = 0

-- Create table
CREATE TABLE IF NOT EXISTS "game_level_rounds" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "game_level_id" bigint NOT NULL REFERENCES "game_levels" ("id") ON DELETE CASCADE,
  "round_index" integer NOT NULL,
  "instruction" text,
  "instruction_audio_path" text,
  "content_pack" jsonb NOT NULL,
  "difficulty_params" jsonb NOT NULL,
  "difficulty" smallint,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "game_level_rounds_level_index_unique" UNIQUE ("game_level_id", "round_index"),
  CONSTRAINT "check_game_level_rounds_index_non_negative" CHECK ("round_index" >= 0),
  CONSTRAINT "check_game_level_rounds_difficulty_range" CHECK ("difficulty" IS NULL OR ("difficulty" >= 1 AND "difficulty" <= 5))
);

-- Index for fast lookup by level
CREATE INDEX IF NOT EXISTS "idx_game_level_rounds_level_id" ON "game_level_rounds" ("game_level_id");

-- Expand: copy existing game_levels data into game_level_rounds as round_index = 0
INSERT INTO "game_level_rounds" ("game_level_id", "round_index", "instruction", "instruction_audio_path", "content_pack", "difficulty_params", "difficulty")
SELECT
  "id",
  0,
  "instruction",
  "instruction_audio_path",
  "content_pack",
  "difficulty_params",
  "difficulty"
FROM "game_levels"
ON CONFLICT ("game_level_id", "round_index") DO NOTHING;
