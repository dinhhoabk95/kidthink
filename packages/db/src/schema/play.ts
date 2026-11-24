import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { JsonRecord } from "#src/constants/json";
import {
  type AccessTier,
  PLAY_COMPLETION_STATUS,
  type PlayCompletionStatus,
} from "#src/constants/learning-enums";
import { childProfiles } from "./child.ts";
import {
  idPk,
  insertOnlyTimestamps,
  nowTimestampMs,
  timestampMs,
  timestamps,
  uuidCol,
} from "./columns.ts";
import { gameLevels } from "./game.ts";
import { skills } from "./taxonomy.ts";

export const playSessions = sqliteTable(
  "play_sessions",
  {
    id: idPk(),
    sessionUuid: uuidCol("session_uuid"),
    childProfileId: integer("child_profile_id").references(
      () => childProfiles.id,
      { onDelete: "cascade" }
    ),
    guestDeviceId: text("guest_device_id"),
    gameLevelId: integer("game_level_id")
      .notNull()
      .references(() => gameLevels.id, { onDelete: "restrict" }),
    templateCode: text("template_code").notNull(),
    isPreview: integer("is_preview", { mode: "boolean" })
      .notNull()
      .default(false),
    completionStatus: integer("completion_status")
      .$type<PlayCompletionStatus>()
      .notNull()
      .default(PLAY_COMPLETION_STATUS.IN_PROGRESS),
    accessTierAtStart: integer("access_tier_at_start").$type<AccessTier>(),
    layoutSeed: integer("layout_seed"),
    starsEarned: integer("stars_earned").default(0),
    score: integer("score").default(0),
    durationSeconds: integer("duration_seconds").default(0),
    startedAt: nowTimestampMs("started_at"),
    completedAt: timestampMs("completed_at"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_play_sessions_session_uuid").on(table.sessionUuid),
    index("idx_play_sessions_game_level_id").on(table.gameLevelId),
    index("idx_play_sessions_status_started_at").on(
      table.completionStatus,
      table.startedAt
    ),
    index("idx_play_sessions_child_started_at")
      .on(table.childProfileId, table.startedAt)
      .where(sql`${table.childProfileId} IS NOT NULL`),
    index("idx_play_sessions_guest_status")
      .on(table.guestDeviceId, table.completionStatus)
      .where(sql`${table.guestDeviceId} IS NOT NULL`),
  ]
);

export const telemetryEvents = sqliteTable(
  "telemetry_events",
  {
    sessionUuid: text("session_uuid").notNull(),
    seq: integer("seq").notNull(),
    childUuid: text("child_uuid"),
    gameLevelId: integer("game_level_id"),
    templateCode: text("template_code"),
    eventName: text("event_name").notNull(),
    occurredAtMs: integer("occurred_at_ms"),
    payload: text("payload", { mode: "json" }).$type<JsonRecord>(),
    clientTimestamp: timestampMs("client_timestamp"),
    ingestedAt: nowTimestampMs("ingested_at"),
    ...insertOnlyTimestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.sessionUuid, table.seq] }),
    index("idx_telemetry_events_created_at").on(table.createdAt),
    index("idx_telemetry_events_child_uuid")
      .on(table.childUuid)
      .where(sql`${table.childUuid} IS NOT NULL`),
  ]
);

export const childSessionSummaries = sqliteTable(
  "child_session_summaries",
  {
    id: idPk(),
    childProfileId: integer("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    sessionUuid: text("session_uuid").notNull(),
    gameLevelId: integer("game_level_id")
      .notNull()
      .references(() => gameLevels.id, { onDelete: "restrict" }),
    templateCode: text("template_code").notNull(),
    completionStatus: integer("completion_status")
      .$type<PlayCompletionStatus>()
      .notNull(),
    score: integer("score").notNull().default(0),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    starsEarned: integer("stars_earned").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    retriesCount: integer("retries_count").notNull().default(0),
    completedAt: timestampMs("completed_at"),
    ...timestamps(),
  },
  (table) => [
    unique("child_session_summaries_child_session_unique").on(
      table.childProfileId,
      table.sessionUuid
    ),
    index("idx_child_session_summaries_game_level_id").on(table.gameLevelId),
    index("idx_child_session_summaries_session_uuid").on(table.sessionUuid),
  ]
);

export const childDailyStats = sqliteTable(
  "child_daily_stats",
  {
    id: idPk(),
    childProfileId: integer("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    dateIct: text("date_ict").notNull(),
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

export const levelDailyStats = sqliteTable(
  "level_daily_stats",
  {
    id: idPk(),
    levelCode: text("level_code").notNull(),
    dateIct: text("date_ict").notNull(),
    playsCount: integer("plays_count").notNull().default(0),
    completionsCount: integer("completions_count").notNull().default(0),
    abandonedCount: integer("abandoned_count").notNull().default(0),
    avgDurationSeconds: integer("avg_duration_seconds").notNull().default(0),
    avgHintsUsed: integer("avg_hints_used").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    unique("level_daily_stats_level_date_unique").on(
      table.levelCode,
      table.dateIct
    ),
  ]
);

export const skillDailyStats = sqliteTable(
  "skill_daily_stats",
  {
    id: idPk(),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    dateIct: text("date_ict").notNull(),
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
