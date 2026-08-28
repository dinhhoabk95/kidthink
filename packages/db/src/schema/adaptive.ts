import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { timestamps } from "./columns.ts";
import { gameLevels } from "./game.ts";
import { skills } from "./taxonomy.ts";

export const masteryState = pgTable(
  "mastery_state",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    pLearn: numeric("p_learn", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1000"),
    emaCorrect: numeric("ema_correct", { precision: 5, scale: 4 })
      .notNull()
      .default("0.5000"),
    hintRate: numeric("hint_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.0000"),
    attemptsTotal: integer("attempts_total").notNull().default(0),
    bestPLearn: numeric("best_p_learn", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1000"),
    paramsVersion: varchar("params_version", { length: 20 })
      .notNull()
      .default("v1"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("mastery_state_child_skill_unique").on(
      table.childProfileId,
      table.skillId
    ),
    check(
      "check_mastery_state_p_learn",
      sql`${table.pLearn} >= 0 AND ${table.pLearn} <= 1`
    ),
    check(
      "check_mastery_state_ema_correct",
      sql`${table.emaCorrect} >= 0 AND ${table.emaCorrect} <= 1`
    ),
    check(
      "check_mastery_state_hint_rate",
      sql`${table.hintRate} >= 0 AND ${table.hintRate} <= 1`
    ),
    check(
      "check_mastery_state_best_p_learn",
      sql`${table.bestPLearn} >= 0 AND ${table.bestPLearn} <= 1`
    ),
  ]
);

export const levelParams = pgTable(
  "level_params",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    gameLevelId: bigint("game_level_id", { mode: "number" })
      .notNull()
      .references(() => gameLevels.id, { onDelete: "cascade" }),
    paramOverrides: jsonb("param_overrides"),
    adaptiveFactor: numeric("adaptive_factor", { precision: 5, scale: 4 })
      .notNull()
      .default("1.0000"),
    ...timestamps(),
  },
  (table) => [
    unique("level_params_child_game_level_unique").on(
      table.childProfileId,
      table.gameLevelId
    ),
  ]
);

export const childBadges = pgTable(
  "child_badges",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    badgeCode: varchar("badge_code", { length: 50 }).notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sourceRef: varchar("source_ref", { length: 100 }),
    ...timestamps(),
  },
  (table) => [
    unique("child_badges_child_profile_id_badge_code_unique").on(
      table.childProfileId,
      table.badgeCode
    ),
  ]
);
