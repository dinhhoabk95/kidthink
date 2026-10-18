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
    .select()
    .from(playSessions)
    .where(and(...conditions));

  if (sessions.length === 0) {
    return 0;
  }

  const sessionUuids = sessions.map((s) => s.sessionUuid);
  const allEvents = await db
    .select()
    .from(telemetryEvents)
    .where(inArray(telemetryEvents.sessionUuid, sessionUuids))
    .orderBy(telemetryEvents.seq);

  const eventsBySession = new Map<string, TelemetryEventInput[]>();
  for (const e of allEvents) {
    const list = eventsBySession.get(e.sessionUuid) ?? [];
    list.push({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: isPayloadRecord(e.payload) ? e.payload : null,
      clientTimestamp: e.clientTimestamp,
    });
    eventsBySession.set(e.sessionUuid, list);
  }

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

  let childStatsCount = 0;
  for (const [childProfileId, agg] of grouped.entries()) {
    await db
      .insert(childDailyStats)
      .values({
        childProfileId,
        dateIct,
        sessionsCount: agg.sessionsCount,
        totalPlayTimeSeconds: agg.totalPlayTimeSeconds,
        levelsAttempted: agg.levelIds.size,
        levelsCompleted: agg.levelsCompleted,
        skillsTouched: 0,
        starsEarned: agg.starsEarned,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [childDailyStats.childProfileId, childDailyStats.dateIct],
        set: {
          sessionsCount: agg.sessionsCount,
          totalPlayTimeSeconds: agg.totalPlayTimeSeconds,
          levelsAttempted: agg.levelIds.size,
          levelsCompleted: agg.levelsCompleted,
          starsEarned: agg.starsEarned,
          updatedAt: new Date(),
        },
      });
    childStatsCount++;
  }

  return childStatsCount;
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

  // 2. Rollup level_daily_stats (by level_code, content_version, date_ict)
  const levelAggregates = await db
    .select({
      levelCode: gameLevels.code,
      contentVersion: playSessions.contentVersion,
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
    .groupBy(gameLevels.code, playSessions.contentVersion);

  let levelStatsCount = 0;
  for (const agg of levelAggregates) {
    await db
      .insert(levelDailyStats)
      .values({
        levelCode: agg.levelCode,
        contentVersion: agg.contentVersion,
        dateIct,
        playsCount: agg.playsCount,
        completionsCount: agg.completionsCount,
        abandonedCount: agg.abandonedCount,
        avgDurationSeconds: agg.avgDurationSeconds,
        avgHintsUsed: 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          levelDailyStats.levelCode,
          levelDailyStats.contentVersion,
          levelDailyStats.dateIct,
        ],
        set: {
          playsCount: agg.playsCount,
          completionsCount: agg.completionsCount,
          abandonedCount: agg.abandonedCount,
          avgDurationSeconds: agg.avgDurationSeconds,
          updatedAt: new Date(),
        },
      });
    levelStatsCount++;
  }

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

  let skillStatsCount = 0;
  for (const agg of skillAggregates) {
    const accuracy =
      agg.exposureCount > 0
        ? Math.round((agg.completions / agg.exposureCount) * 100)
        : 0;

    await db
      .insert(skillDailyStats)
      .values({
        skillId: agg.skillId,
        dateIct,
        exposureCount: agg.exposureCount,
        avgAccuracyPercent: accuracy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [skillDailyStats.skillId, skillDailyStats.dateIct],
        set: {
          exposureCount: agg.exposureCount,
          avgAccuracyPercent: accuracy,
          updatedAt: new Date(),
        },
      });
    skillStatsCount++;
  }

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
    .returning();

  return { expiredCount: updated.length };
}
