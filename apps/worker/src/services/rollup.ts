import {
  childDailyStats,
  contentSkillMap,
  entitlements,
  gameLevels,
  getOwnerDb,
  levelDailyStats,
  playSessions,
  skillDailyStats,
  telemetryEvents,
} from "@mindkid/db";
import {
  computePausedDurationMs,
  computeSessionResult,
  getDateIct,
  type TelemetryEventInput,
} from "@mindkid/shared";
import { and, count, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";

export interface RollupDailyResult {
  dateIct: string;
  childStatsCount: number;
  levelStatsCount: number;
  skillStatsCount: number;
}

function isPayloadRecord(
  val: typeof telemetryEvents.$inferSelect.payload
): val is NonNullable<TelemetryEventInput["payload"]> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export function computeNetSessionDurationSeconds(
  sessionDurationSeconds: number | null,
  events: readonly TelemetryEventInput[]
): number {
  const baseSec = Math.max(0, sessionDurationSeconds ?? 0);
  if (events.length === 0) {
    return baseSec;
  }

  const result = computeSessionResult([...events]);
  const reconstructedSec = Math.round(result.metrics.duration_ms / 1000);
  if (reconstructedSec > 0) {
    return reconstructedSec;
  }

  const pausedSec = Math.round(computePausedDurationMs(events) / 1000);
  return Math.max(0, baseSec - pausedSec);
}

async function fetchSessionEventsByUuid(
  db: ReturnType<typeof getOwnerDb>,
  sessionUuids: string[]
): Promise<Map<string, TelemetryEventInput[]>> {
  const EVENT_CHUNK_SIZE = 200;
  const eventsBySession = new Map<string, TelemetryEventInput[]>();

  for (let i = 0; i < sessionUuids.length; i += EVENT_CHUNK_SIZE) {
    const chunkUuids = sessionUuids.slice(i, i + EVENT_CHUNK_SIZE);
    const chunkEvents = await db
      .select({
        sessionUuid: telemetryEvents.sessionUuid,
        seq: telemetryEvents.seq,
        eventName: telemetryEvents.eventName,
        occurredAtMs: telemetryEvents.occurredAtMs,
        payload: telemetryEvents.payload,
      })
      .from(telemetryEvents)
      .where(inArray(telemetryEvents.sessionUuid, chunkUuids))
      .orderBy(telemetryEvents.seq);

    for (const e of chunkEvents) {
      const list = eventsBySession.get(e.sessionUuid) ?? [];
      list.push({
        sessionUuid: e.sessionUuid,
        seq: e.seq,
        eventName: e.eventName,
        occurredAtMs: e.occurredAtMs,
        payload: isPayloadRecord(e.payload) ? e.payload : null,
      });
      eventsBySession.set(e.sessionUuid, list);
    }
  }

  return eventsBySession;
}

export async function rollupChildDailyStatsForWindow(
  db: ReturnType<typeof getOwnerDb>,
  dateIct: string,
  childProfileIdFilter?: number
): Promise<number> {
  const startIctIso = `${dateIct}T00:00:00.000+07:00`;
  const endIctIso = `${dateIct}T23:59:59.999+07:00`;
  const startDate = new Date(startIctIso);
  const endDate = new Date(endIctIso);

  const conditions = [
    isNotNull(playSessions.childProfileId),
    gte(playSessions.startedAt, startDate),
    lt(playSessions.startedAt, endDate),
  ];
  if (childProfileIdFilter !== undefined) {
    conditions.push(eq(playSessions.childProfileId, childProfileIdFilter));
  }

  const sessions = await db
    .select({
      sessionUuid: playSessions.sessionUuid,
      childProfileId: playSessions.childProfileId,
      gameLevelId: playSessions.gameLevelId,
      isPreview: playSessions.isPreview,
      completionStatus: playSessions.completionStatus,
      durationSeconds: playSessions.durationSeconds,
      starsEarned: playSessions.starsEarned,
      startedAt: playSessions.startedAt,
      completedAt: playSessions.completedAt,
      score: playSessions.score,
    })
    .from(playSessions)
    .where(and(...conditions));

  if (sessions.length === 0) {
    return 0;
  }

  const sessionUuids = sessions.map((s) => s.sessionUuid);
  const eventsBySession = await fetchSessionEventsByUuid(db, sessionUuids);

  const grouped = new Map<
    number,
    {
      sessionsCount: number;
      totalPlayTimeSeconds: number;
      levelIds: Set<number>;
      levelsCompleted: number;
      starsEarned: number;
    }
  >();

  for (const s of sessions) {
    if (s.childProfileId === null) {
      continue;
    }
    const childId = Number(s.childProfileId);
    const current = grouped.get(childId) ?? {
      sessionsCount: 0,
      totalPlayTimeSeconds: 0,
      levelIds: new Set<number>(),
      levelsCompleted: 0,
      starsEarned: 0,
    };

    const sEvents = eventsBySession.get(s.sessionUuid) ?? [];
    const netSec = computeNetSessionDurationSeconds(s.durationSeconds, sEvents);

    current.sessionsCount += 1;
    current.totalPlayTimeSeconds += netSec;
    current.levelIds.add(s.gameLevelId);
    if (s.completionStatus === "completed") {
      current.levelsCompleted += 1;
    }
    current.starsEarned += s.starsEarned ?? 0;
    grouped.set(childId, current);
  }

  const now = new Date();
  const childRows = Array.from(grouped.entries()).map(
    ([childProfileId, agg]) => ({
      childProfileId,
      dateIct,
      sessionsCount: agg.sessionsCount,
      totalPlayTimeSeconds: agg.totalPlayTimeSeconds,
      levelsAttempted: agg.levelIds.size,
      levelsCompleted: agg.levelsCompleted,
      skillsTouched: 0,
      starsEarned: agg.starsEarned,
      updatedAt: now,
    })
  );

  const UPSERT_BATCH_SIZE = 500;
  for (let i = 0; i < childRows.length; i += UPSERT_BATCH_SIZE) {
    const batch = childRows.slice(i, i + UPSERT_BATCH_SIZE);
    await db
      .insert(childDailyStats)
      .values(batch)
      .onConflictDoUpdate({
        target: [childDailyStats.childProfileId, childDailyStats.dateIct],
        set: {
          sessionsCount: sql`excluded.sessions_count`,
          totalPlayTimeSeconds: sql`excluded.total_play_time_seconds`,
          levelsAttempted: sql`excluded.levels_attempted`,
          levelsCompleted: sql`excluded.levels_completed`,
          starsEarned: sql`excluded.stars_earned`,
          updatedAt: now,
        },
      });
  }

  return childRows.length;
}

/**
 * BR-TLM-02 & BR-TLM-05 & BR-TLM-08:
 * Executes daily rollup for date_ict (UTC+7).
 * Idempotent — running multiple times produces identical results.
 * Ignores guest sessions (child_profile_id IS NULL) for child KPI.
 * Preserves extra_time_granted_minutes on child_daily_stats and subtracts paused_ms (BR-HPL-07).
 */
export async function runDailyRollup(
  targetDateIct?: string
): Promise<RollupDailyResult> {
  const db = getOwnerDb();
  const dateIct = targetDateIct || getDateIct();

  // Define date window in UTC corresponding to 00:00 to 23:59:59 ICT
  const startIctIso = `${dateIct}T00:00:00.000+07:00`;
  const endIctIso = `${dateIct}T23:59:59.999+07:00`;
  const startDate = new Date(startIctIso);
  const endDate = new Date(endIctIso);

  // 1. Rollup child_daily_stats (ignoring NULL child_profile_id per BR-TLM-05)
  const childStatsCount = await rollupChildDailyStatsForWindow(db, dateIct);

  // 2. Rollup level_daily_stats (by level_code, date_ict)
  const levelAggregates = await db
    .select({
      levelCode: gameLevels.code,
      playsCount: count(playSessions.id),
      completionsCount: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN 1 END)::int`,
      abandonedCount: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'abandoned' THEN 1 END)::int`,
      avgDurationSeconds: sql<number>`COALESCE(AVG(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN ${playSessions.durationSeconds} END), 0)::int`,
    })
    .from(playSessions)
    .innerJoin(gameLevels, eq(playSessions.gameLevelId, gameLevels.id))
    .where(
      and(
        gte(playSessions.startedAt, startDate),
        lt(playSessions.startedAt, endDate)
      )
    )
    .groupBy(gameLevels.code);

  const now = new Date();
  const UPSERT_BATCH_SIZE = 500;
  const levelRows = levelAggregates.map((agg) => ({
    levelCode: agg.levelCode,
    dateIct,
    playsCount: agg.playsCount,
    completionsCount: agg.completionsCount,
    abandonedCount: agg.abandonedCount,
    avgDurationSeconds: agg.avgDurationSeconds,
    avgHintsUsed: 0,
    updatedAt: now,
  }));

  for (let i = 0; i < levelRows.length; i += UPSERT_BATCH_SIZE) {
    const batch = levelRows.slice(i, i + UPSERT_BATCH_SIZE);
    await db
      .insert(levelDailyStats)
      .values(batch)
      .onConflictDoUpdate({
        target: [levelDailyStats.levelCode, levelDailyStats.dateIct],
        set: {
          playsCount: sql`excluded.plays_count`,
          completionsCount: sql`excluded.completions_count`,
          abandonedCount: sql`excluded.abandoned_count`,
          avgDurationSeconds: sql`excluded.avg_duration_seconds`,
          updatedAt: now,
        },
      });
  }
  const levelStatsCount = levelRows.length;

  // 3. Rollup skill_daily_stats (by skill_id, date_ict; ignoring NULL child_profile_id per BR-TLM-05)
  const skillAggregates = await db
    .select({
      skillId: contentSkillMap.skillId,
      exposureCount: count(playSessions.id),
      completions: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN 1 END)::int`,
    })
    .from(playSessions)
    .innerJoin(
      contentSkillMap,
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(playSessions.gameLevelId, contentSkillMap.entityId)
      )
    )
    .where(
      and(
        isNotNull(playSessions.childProfileId),
        gte(playSessions.startedAt, startDate),
        lt(playSessions.startedAt, endDate)
      )
    )
    .groupBy(contentSkillMap.skillId);

  const skillRows = skillAggregates.map((agg) => ({
    skillId: agg.skillId,
    dateIct,
    exposureCount: agg.exposureCount,
    avgAccuracyPercent:
      agg.exposureCount > 0
        ? Math.round((agg.completions / agg.exposureCount) * 100)
        : 0,
    updatedAt: now,
  }));

  for (let i = 0; i < skillRows.length; i += UPSERT_BATCH_SIZE) {
    const batch = skillRows.slice(i, i + UPSERT_BATCH_SIZE);
    await db
      .insert(skillDailyStats)
      .values(batch)
      .onConflictDoUpdate({
        target: [skillDailyStats.skillId, skillDailyStats.dateIct],
        set: {
          exposureCount: sql`excluded.exposure_count`,
          avgAccuracyPercent: sql`excluded.avg_accuracy_percent`,
          updatedAt: now,
        },
      });
  }
  const skillStatsCount = skillRows.length;

  return {
    dateIct,
    childStatsCount,
    levelStatsCount,
    skillStatsCount,
  };
}

/**
 * Sweeps expired entitlements and transitions active -> expired.
 */
export async function runExpireEntitlements(
  targetDateIct?: string
): Promise<{ expiredCount: number }> {
  const db = getOwnerDb();
  const _dateIct = targetDateIct || getDateIct();
  const now = new Date();

  const updated = await db
    .update(entitlements)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        eq(entitlements.status, "active"),
        isNotNull(entitlements.expiresAt),
        lt(entitlements.expiresAt, now)
      )
    )
    .returning({ id: entitlements.id });

  return { expiredCount: updated.length };
}
