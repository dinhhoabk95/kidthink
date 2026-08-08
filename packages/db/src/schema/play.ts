import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { gameLevels, gameTemplates } from "./game.ts";
import { skills } from "./taxonomy.ts";

export const playSessions = pgTable(
  "play_sessions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    sessionUuid: uuid("session_uuid").defaultRandom().notNull(),
    childProfileId: bigint("child_profile_id", { mode: "number" }).references(
      () => childProfiles.id,
      { onDelete: "cascade" }
    ),
    guestDeviceId: varchar("guest_device_id", { length: 100 }),
    gameLevelId: bigint("game_level_id", { mode: "number" })
      .notNull()
      .references(() => gameLevels.id),
    contentVersion: integer("content_version").notNull(),
    templateId: bigint("template_id", { mode: "number" })
      .notNull()
      .references(() => gameTemplates.id),
    completionStatus: varchar("completion_status", { length: 20 })
      .notNull()
      .default("in_progress"),
    starsEarned: smallint("stars_earned").default(0),
    score: integer("score").default(0),
    durationSeconds: integer("duration_seconds").default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "check_play_sessions_identity",
      sql`${table.childProfileId} IS NOT NULL OR ${table.guestDeviceId} IS NOT NULL`
    ),
  ]
);

export const telemetryEvents = pgTable(
  "telemetry_events",
  {
    sessionUuid: uuid("session_uuid").notNull(),
    seq: integer("seq").notNull(),
    eventName: varchar("event_name", { length: 100 }).notNull(),
    payload: jsonb("payload"),
    clientTimestamp: timestamp("client_timestamp", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.sessionUuid, table.seq] })]
);

export const childDailyStats = pgTable(
  "child_daily_stats",
  {
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    totalPlayTimeSeconds: integer("total_play_time_seconds")
      .notNull()
      .default(0),
    levelsAttempted: integer("levels_attempted").notNull().default(0),
    levelsCompleted: integer("levels_completed").notNull().default(0),
    starsEarned: integer("stars_earned").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.childProfileId, table.date] })]
);

export const levelDailyStats = pgTable(
  "level_daily_stats",
  {
    gameLevelId: bigint("game_level_id", { mode: "number" })
      .notNull()
      .references(() => gameLevels.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    playsCount: integer("plays_count").notNull().default(0),
    completionsCount: integer("completions_count").notNull().default(0),
    avgDurationSeconds: integer("avg_duration_seconds").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.gameLevelId, table.date] })]
);

export const skillDailyStats = pgTable(
  "skill_daily_stats",
  {
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    practiceCount: integer("practice_count").notNull().default(0),
    avgMastery: smallint("avg_mastery").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.skillId, table.date] })]
);
