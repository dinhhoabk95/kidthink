import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import type { JsonRecord } from "#src/constants/json";
import type { AccessTier } from "#src/constants/learning-enums";
import { idPk, timestamps } from "./columns.ts";
import { skillDatasets } from "./taxonomy.ts";

export const gameLevels = sqliteTable(
  "game_levels",
  {
    id: idPk(),
    code: text("code").notNull().unique(),
    templateCode: text("template_code").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    instruction: text("instruction"),
    instructionAudioPath: text("instruction_audio_path"),
    contentPack: text("content_pack", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    difficultyParams: text("difficulty_params", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    themeId: text("theme_id"),
    ageMin: integer("age_min"),
    ageMax: integer("age_max"),
    difficulty: integer("difficulty"),
    accessTier: integer("access_tier").$type<AccessTier>().notNull(),
    thumbnailEmoji: text("thumbnail_emoji"),
    skillDatasetId: integer("skill_dataset_id").references(
      () => skillDatasets.id,
      { onDelete: "set null" }
    ),
    projectionRef: text("projection_ref"),
    ...timestamps(),
  },
  (table) => [
    index("idx_game_levels_skill_dataset_id")
      .on(table.skillDatasetId)
      .where(sql`${table.skillDatasetId} IS NOT NULL`),
    index("idx_game_levels_catalog").on(
      table.accessTier,
      table.difficulty,
      table.id
    ),
  ]
);

export const gameLevelRounds = sqliteTable(
  "game_level_rounds",
  {
    id: idPk(),
    gameLevelId: integer("game_level_id")
      .notNull()
      .references(() => gameLevels.id, { onDelete: "cascade" }),
    roundIndex: integer("round_index").notNull(),
    instruction: text("instruction"),
    instructionAudioPath: text("instruction_audio_path"),
    contentPack: text("content_pack", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    difficultyParams: text("difficulty_params", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    difficulty: integer("difficulty"),
    ...timestamps(),
  },
  (table) => [
    unique("game_level_rounds_level_index_unique").on(
      table.gameLevelId,
      table.roundIndex
    ),
  ]
);
