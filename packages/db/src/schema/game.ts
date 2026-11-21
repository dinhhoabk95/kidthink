import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { idPk, timestamps } from "./columns.ts";
import { skillDatasets } from "./taxonomy.ts";

export const accessTierEnum = pgEnum("access_tier", [
  "free",
  "login",
  "standard",
  "premium",
]);

export const gameLevels = pgTable(
  "game_levels",
  {
    id: idPk(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    templateCode: varchar("template_code", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    instruction: text("instruction"),
    instructionAudioPath: text("instruction_audio_path"),
    contentPack: jsonb("content_pack").notNull(),
    difficultyParams: jsonb("difficulty_params").notNull(),
    themeId: varchar("theme_id", { length: 50 }),
    ageMin: smallint("age_min"),
    ageMax: smallint("age_max"),
    difficulty: smallint("difficulty"),
    accessTier: accessTierEnum("access_tier").notNull(),
    thumbnailEmoji: varchar("thumbnail_emoji", { length: 50 }),
    skillDatasetId: bigint("skill_dataset_id", { mode: "number" }).references(
      () => skillDatasets.id,
      { onDelete: "set null" }
    ),
    projectionRef: varchar("projection_ref", { length: 100 }),
    ...timestamps(),
  },
  (table) => [
    // Tra cứu nội dung theo khoá JSONB (content-search) — không có GIN thì mỗi
    // truy vấn quét toàn bảng game_levels.
    index("idx_game_levels_content_pack_gin").using("gin", table.contentPack),
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

export const gameLevelRounds = pgTable(
  "game_level_rounds",
  {
    id: idPk(),
    gameLevelId: bigint("game_level_id", { mode: "number" })
      .notNull()
      .references(() => gameLevels.id, { onDelete: "cascade" }),
    roundIndex: integer("round_index").notNull(),
    instruction: text("instruction"),
    instructionAudioPath: text("instruction_audio_path"),
    contentPack: jsonb("content_pack").notNull(),
    difficultyParams: jsonb("difficulty_params").notNull(),
    difficulty: smallint("difficulty"),
    ...timestamps(),
  },
  (table) => [
    // UNIQUE (game_level_id, round_index) đã phủ tra cứu theo game_level_id.
    unique("game_level_rounds_level_index_unique").on(
      table.gameLevelId,
      table.roundIndex
    ),
  ]
);
