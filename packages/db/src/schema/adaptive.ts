import {
  bigint,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { idPk, timestamps } from "./columns.ts";
import { skills } from "./taxonomy.ts";

export const masteryState = pgTable(
  "mastery_state",
  {
    id: idPk(),
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
    index("idx_mastery_state_skill_id").on(table.skillId),
  ]
);

export const childBadges = pgTable(
  "child_badges",
  {
    id: idPk(),
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
