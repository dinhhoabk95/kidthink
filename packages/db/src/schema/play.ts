import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { timestamps } from "./columns.ts";
import { gameLevels } from "./game.ts";
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
    templateCode: varchar("template_code", { length: 20 }).notNull(),
    isPreview: boolean("is_preview").notNull().default(false),
    completionStatus: varchar("completion_status", { length: 20 })
      .notNull()
      .default("in_progress"),
    accessTierAtStart: varchar("access_tier_at_start", { length: 20 }),
    layoutSeed: bigint("layout_seed", { mode: "number" }),
    starsEarned: smallint("stars_earned").default(0),
    score: integer("score").default(0),
    durationSeconds: integer("duration_seconds").default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_play_sessions_identity",
      sql`${table.childProfileId} IS NOT NULL OR ${table.guestDeviceId} IS NOT NULL`
    ),
    check(
      "check_play_sessions_layout_seed",
      sql`${table.layoutSeed} IS NULL OR (${table.layoutSeed} >= 0 AND ${table.layoutSeed} <= 4294967295)`
    ),
  ]
);

export const telemetryEvents = pgTable(
  "telemetry_events",
  {
    sessionUuid: uuid("session_uuid").notNull(),
    seq: integer("seq").notNull(),
    childUuid: uuid("child_uuid"),
    gameLevelId: bigint("game_level_id", { mode: "number" }),
    contentVersion: integer("content_version"),
    templateCode: varchar("template_code", { length: 20 }),
    eventName: varchar("event_name", { length: 100 }).notNull(),
    occurredAtMs: integer("occurred_at_ms"),
    payload: jsonb("payload"),
    clientTimestamp: timestamp("client_timestamp", { withTimezone: true }),
    ingestedAt: timestamp("ingested_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.sessionUuid, table.seq] })]
);

export const childSessionSummaries = pgTable(
  "child_session_summaries",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    sessionUuid: uuid("session_uuid").notNull(),
    gameLevelId: bigint("game_level_id", { mode: "number" })
      .notNull()
      .references(() => gameLevels.id),
    contentVersion: integer("content_version").notNull(),
    templateCode: varchar("template_code", { length: 20 }).notNull(),
    completionStatus: varchar("completion_status", { length: 20 }).notNull(),
    score: integer("score").notNull().default(0),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    starsEarned: smallint("stars_earned").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    retriesCount: integer("retries_count").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("child_session_summaries_child_session_unique").on(
      table.childProfileId,
      table.sessionUuid
    ),
  ]
);

export const childDailyStats = pgTable(
  "child_daily_stats",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    dateIct: varchar("date_ict", { length: 10 }).notNull(),
    sessionsCount: integer("sessions_count").notNull().default(0),
    totalPlayTimeSeconds: integer("total_play_time_seconds")
      .notNull()
      .default(0),
    levelsAttempted: integer("levels_attempted").notNull().default(0),
    levelsCompleted: integer("levels_completed").notNull().default(0),
    skillsTouched: integer("skills_touched").notNull().default(0),
    starsEarned: integer("stars_earned").notNull().default(0),
    extraTimeGrantedMinutes: integer("extra_time_granted_minutes")
      .notNull()
      .default(0),
    ...timestamps(),
  },
  (table) => [
    unique("child_daily_stats_child_date_unique").on(
      table.childProfileId,
      table.dateIct
    ),
  ]
);

export const levelDailyStats = pgTable(
  "level_daily_stats",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    levelCode: varchar("level_code", { length: 40 }).notNull(),
    contentVersion: integer("content_version").notNull(),
    dateIct: varchar("date_ict", { length: 10 }).notNull(),
    playsCount: integer("plays_count").notNull().default(0),
    completionsCount: integer("completions_count").notNull().default(0),
    abandonedCount: integer("abandoned_count").notNull().default(0),
    avgDurationSeconds: integer("avg_duration_seconds").notNull().default(0),
    avgHintsUsed: integer("avg_hints_used").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    unique("level_daily_stats_level_version_date_unique").on(
      table.levelCode,
      table.contentVersion,
      table.dateIct
    ),
  ]
);

export const skillDailyStats = pgTable(
  "skill_daily_stats",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    dateIct: varchar("date_ict", { length: 10 }).notNull(),
    exposureCount: integer("exposure_count").notNull().default(0),
    avgAccuracyPercent: integer("avg_accuracy_percent").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    unique("skill_daily_stats_skill_date_unique").on(
      table.skillId,
      table.dateIct
    ),
  ]
);
