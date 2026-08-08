import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { managers } from "./identity.ts";

export const gameTemplateStatusEnum = pgEnum("game_template_status", [
  "active",
  "deprecated",
]);

export const contentLifecycleStatusEnum = pgEnum("content_lifecycle_status", [
  "draft",
  "submitted",
  "approved",
  "published",
  "archived",
  "rejected",
]);

export const accessTierEnum = pgEnum("access_tier", [
  "free",
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
    nameVi: varchar("name_vi", { length: 100 }).notNull(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
    titleVi: varchar("title_vi", { length: 200 }).notNull(),
    descriptionVi: text("description_vi"),
    instructionVi: text("instruction_vi"),
    instructionAudioPath: text("instruction_audio_path"),
    contentPack: jsonb("content_pack").notNull(),
    difficultyParams: jsonb("difficulty_params").notNull(),
    themeId: varchar("theme_id", { length: 50 }),
    ageMin: smallint("age_min"),
    ageMax: smallint("age_max"),
    difficulty: smallint("difficulty"),
    accessTier: accessTierEnum("access_tier").notNull(),
    thumbnailEmoji: varchar("thumbnail_emoji", { length: 50 }),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("game_levels_code_version_unique").on(
      table.code,
      table.contentVersion
    ),
    uniqueIndex("idx_game_levels_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    check(
      "check_game_levels_code_format",
      sql`${table.code} ~ '^GL-C[1-6]-[A-Z]{2,5}-[A-Z]{2,5}-\\d{4}$'`
    ),
  ]
);
