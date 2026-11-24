import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { childProfiles } from "./child.ts";
import { idPk, nowTimestampMs, timestampMs, timestamps } from "./columns.ts";
import { skills } from "./taxonomy.ts";

export const masteryState = sqliteTable(
  "mastery_state",
  {
    id: idPk(),
    childProfileId: integer("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    pLearn: text("p_learn").notNull().default("0.1000"),
    emaCorrect: text("ema_correct").notNull().default("0.5000"),
    hintRate: text("hint_rate").notNull().default("0.0000"),
    attemptsTotal: integer("attempts_total").notNull().default(0),
    bestPLearn: text("best_p_learn").notNull().default("0.1000"),
    paramsVersion: text("params_version").notNull().default("v1"),
    lastSeenAt: timestampMs("last_seen_at"),
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

export const childBadges = sqliteTable(
  "child_badges",
  {
    id: idPk(),
    childProfileId: integer("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    badgeCode: text("badge_code").notNull(),
    awardedAt: nowTimestampMs("awarded_at"),
    sourceRef: text("source_ref"),
    ...timestamps(),
  },
  (table) => [
    unique("child_badges_child_profile_id_badge_code_unique").on(
      table.childProfileId,
      table.badgeCode
    ),
  ]
);
