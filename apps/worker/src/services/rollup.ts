import { invalidateUserEntitlementsCache } from "@mindkid/cache";
import { getOwnerDb, type OwnerDb, PLAY_COMPLETION_STATUS } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import {
  computePausedDurationMs,
  computeSessionResult,
  getDateIct,
  type TelemetryEventInput,
} from "@mindkid/shared";

export interface RollupDailyResult {
  dateIct: string;
  childStatsCount: number;
  levelStatsCount: number;
  skillStatsCount: number;
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
  db: OwnerDb,
  sessionUuids: string[]
): Promise<Map<string, TelemetryEventInput[]>> {
  const EVENT_CHUNK_SIZE = 200;
  const repos = createRepositories(db);
  const eventsBySession = new Map<string, TelemetryEventInput[]>();
  const chunkEvents = await repos.telemetry.listBySessions(
    sessionUuids,
    EVENT_CHUNK_SIZE
  );

  for (const e of chunkEvents) {
    const list = eventsBySession.get(e.sessionUuid) ?? [];
    list.push({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: e.payload,
    });
    eventsBySession.set(e.sessionUuid, list);
  }

  return eventsBySession;
}

export async function rollupChildDailyStatsForWindow(
  db: OwnerDb,
  dateIct: string,
  childProfileIdFilter?: number
): Promise<number> {
  const startIctIso = `${dateIct}T00:00:00.000+07:00`;
  const endIctIso = `${dateIct}T23:59:59.999+07:00`;
  const startDate = new Date(startIctIso);
  const endDate = new Date(endIctIso);
  const repos = createRepositories(db);

  const sessions = await repos.playSessions.listChildSessionsInWindow(
    startDate,
    endDate,
    childProfileIdFilter
  );

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
    if (s.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED) {
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

  return await repos.analyticsRollup.upsertChildDailyStatsBatch(childRows, 500);
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
  const repos = createRepositories(db);
  const dateIct = targetDateIct || getDateIct();

  // Define date window in UTC corresponding to 00:00 to 23:59:59 ICT
  const startIctIso = `${dateIct}T00:00:00.000+07:00`;
  const endIctIso = `${dateIct}T23:59:59.999+07:00`;
  const startDate = new Date(startIctIso);
  const endDate = new Date(endIctIso);

  // 1. Rollup child_daily_stats (ignoring NULL child_profile_id per BR-TLM-05)
  const childStatsCount = await rollupChildDailyStatsForWindow(db, dateIct);

  // 2. Rollup level_daily_stats (by level_code, date_ict)
  const levelAggregates =
    await repos.analyticsRollup.computeLevelDailyAggregates(startDate, endDate);

  const now = new Date();
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

  const levelStatsCount =
    await repos.analyticsRollup.upsertLevelDailyStatsBatch(levelRows, 500);

  // 3. Rollup skill_daily_stats (by skill_id, date_ict; ignoring NULL child_profile_id per BR-TLM-05)
  const skillAggregates =
    await repos.analyticsRollup.computeSkillDailyAggregates(startDate, endDate);

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

  const skillStatsCount =
    await repos.analyticsRollup.upsertSkillDailyStatsBatch(skillRows, 500);

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
  const repos = createRepositories(getOwnerDb());
  const _dateIct = targetDateIct || getDateIct();
  const expiredRows = await repos.entitlements.expireDue(new Date());
  const distinctUserIds = Array.from(
    new Set(expiredRows.map((row) => row.userId))
  );
  for (const userId of distinctUserIds) {
    await invalidateUserEntitlementsCache(userId);
  }
  return { expiredCount: expiredRows.length };
}
