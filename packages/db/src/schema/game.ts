import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";
import { managers } from "./identity.ts";
import { versioningConstraints } from "./versioning.ts";

export const gameTemplateStatusEnum = pgEnum("game_template_status", [
  "active",
  "deprecated",
]);

export const contentLifecycleStatusEnum = pgEnum("content_lifecycle_status", [
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
  "rejected",
]);

export const accessTierEnum = pgEnum("access_tier", [
  "free",
  "login",
  "standard",
  "premium",
]);

export const contentOriginEnum = pgEnum("content_origin", [
  "human",
  "ai_assisted",
]);

export const authoredInEnum = pgEnum("authored_in", ["repo_seed", "studio"]);

export const gameTemplates = pgTable(
  "game_templates",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 20 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    mechanic: varchar("mechanic", { length: 50 }).notNull(),
    layouts: text("layouts").array(),
    contentContract: jsonb("content_contract"),
    difficultyContract: jsonb("difficulty_contract"),
    limits: jsonb("limits"),
    ageMin: smallint("age_min"),
    ageMax: smallint("age_max"),
    bannedAgeBands: text("banned_age_bands").array(),
    requiresTapFallback: boolean("requires_tap_fallback").default(false),
    assetKinds: text("asset_kinds").array(),
    scoring: jsonb("scoring"),
    events: text("events").array(),
    engineSession: text("engine_session"),
    status: gameTemplateStatusEnum("status").notNull().default("active"),
    version: integer("version").notNull().default(1),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_game_templates_code_format",
      sql`${table.code} ~ '^GT-\\d{3}$'`
    ),
  ]
);

export const gameLevels = pgTable(
  "game_levels",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    templateId: bigint("template_id", { mode: "number" })
      .notNull()
      .references(() => gameTemplates.id),
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
    legacyV1Ref: text("legacy_v1_ref"),
    status: contentLifecycleStatusEnum("status").notNull().default("draft"),
    origin: contentOriginEnum("origin").notNull().default("human"),
    authoredIn: authoredInEnum("authored_in").notNull().default("studio"),
    seedBatchId: bigint("seed_batch_id", { mode: "number" }),
    createdByManagerId: bigint("created_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    reviewedByManagerId: bigint("reviewed_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    ...versioningConstraints({
      uniqueName: "game_levels_code_version_unique",
      publishedIndexName: "idx_game_levels_published_code",
      keyColumn: table.code,
      versionColumn: table.contentVersion,
      statusColumn: table.status,
    }),
    // Tra cứu nội dung theo khoá JSONB (content-search) — không có GIN thì mỗi
    // truy vấn quét toàn bảng game_levels.
    index("idx_game_levels_content_pack_gin").using("gin", table.contentPack),
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
