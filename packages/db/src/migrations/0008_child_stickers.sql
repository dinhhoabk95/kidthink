-- Task #282 — album sticker của trẻ (docs/specs/04-play/sticker-album.md §7.1)
CREATE TABLE IF NOT EXISTS "child_stickers" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "child_profile_id" bigint NOT NULL,
  "child_lesson_play_id" bigint,
  "theme_code" varchar(30) NOT NULL,
  "emoji" varchar(16) NOT NULL,
  "label" varchar(100) NOT NULL,
  "awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_child_stickers_play" UNIQUE ("child_profile_id", "child_lesson_play_id"),
  CONSTRAINT "child_stickers_child_profile_id_child_profiles_id_fk"
    FOREIGN KEY ("child_profile_id") REFERENCES "child_profiles"("id") ON DELETE cascade,
  CONSTRAINT "child_stickers_child_lesson_play_id_child_lesson_plays_id_fk"
    FOREIGN KEY ("child_lesson_play_id") REFERENCES "child_lesson_plays"("id") ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_child_stickers_child"
  ON "child_stickers" ("child_profile_id");
