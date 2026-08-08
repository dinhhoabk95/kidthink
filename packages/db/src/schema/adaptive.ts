import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { gameLevels } from "./game.ts";
import { skills } from "./taxonomy.ts";

export const masteryState = pgTable(
  "mastery_state",
  {
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    pLearn: numeric("p_learn", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1000"),
    pGuess: numeric("p_guess", { precision: 5, scale: 4 })
      .notNull()
      .default("0.2000"),
    pSlip: numeric("p_slip", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1000"),
    pTransit: numeric("p_transit", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1000"),
    emaCorrect: numeric("ema_correct", { precision: 5, scale: 4 })
      .notNull()
      .default("0.5000"),
    attemptsCount: integer("attempts_count").notNull().default(0),
    lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.childProfileId, table.skillId] }),
    check(
      "check_mastery_state_p_learn",
      sql`${table.pLearn} >= 0 AND ${table.pLearn} <= 1`
    ),
    check(
      "check_mastery_state_ema_correct",
      sql`${table.emaCorrect} >= 0 AND ${table.emaCorrect} <= 1`
    ),
  ]
);

export const levelParams = pgTable(
  "level_params",
  {
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
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.childProfileId, table.gameLevelId] }),
  ]
);
