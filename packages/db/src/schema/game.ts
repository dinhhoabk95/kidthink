import { sql } from "drizzle-orm";
import {
  bigint,
  check,
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
import { timestamps } from "./columns.ts";
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
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
      () => skillDatasets.id
    ),
    projectionRef: varchar("projection_ref", { length: 100 }),
    ...timestamps(),
  },
  (table) => [
    // Tra cứu nội dung theo khoá JSONB (content-search) — không có GIN thì mỗi
    // truy vấn quét toàn bảng game_levels.
    index("idx_game_levels_content_pack_gin").using("gin", table.contentPack),
    index("idx_game_levels_skill_dataset_id").on(table.skillDatasetId),
    check(
      "check_game_levels_code_format",
      sql`${table.code} ~ '^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\\d{4}$'`
    ),
  ]
);

export const gameLevelRounds = pgTable(
  "game_level_rounds",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    unique("game_level_rounds_level_index_unique").on(
      table.gameLevelId,
      table.roundIndex
    ),
    index("idx_game_level_rounds_level_id").on(table.gameLevelId),
    check(
      "check_game_level_rounds_index_non_negative",
      sql`${table.roundIndex} >= 0`
    ),
    check(
      "check_game_level_rounds_difficulty_range",
      sql`${table.difficulty} IS NULL OR (${table.difficulty} >= 1 AND ${table.difficulty} <= 5)`
    ),
  ]
);
