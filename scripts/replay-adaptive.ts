import { computeUpdate, type MasteryState } from "@kidthink/adaptive";
import {
  contentSkillMap,
  getOwnerDb,
  masteryState,
  playSessions,
  telemetryEvents,
} from "@kidthink/db";
import { computeSessionResult } from "@kidthink/shared";
import { and, asc, eq } from "drizzle-orm";

export interface ReplayOptions {
  sampleLimit?: number;
  alpha?: number;
  beta?: number;
  dryRun?: boolean;
}

export interface ReplayReport {
  total_sessions_replayed: number;
  skills_evaluated: number;
  mean_absolute_error: number;
  max_divergence: number;
  discrepancies: Array<{
    child_id: number;
    skill_id: number;
    db_p_learn: number;
    replayed_p_learn: number;
    divergence: number;
  }>;
}

async function replaySingleSession(
  db: ReturnType<typeof getOwnerDb>,
  session: typeof playSessions.$inferSelect,
  replayedMastery: Map<string, MasteryState>
): Promise<boolean> {
  if (!session.childProfileId) {
    return false;
  }
  const childId = Number(session.childProfileId);

  const mappedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, session.gameLevelId)
      )
    );

  if (mappedSkills.length === 0) {
    return false;
  }

  const events = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, session.sessionUuid))
    .orderBy(telemetryEvents.seq);

  const scoring = computeSessionResult(
    events.map((e) => ({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: e.payload as Record<string, unknown> | null,
      clientTimestamp: e.clientTimestamp,
    }))
  );

  const roundsTotal = scoring.metrics.rounds_total;
  const correctRatio =
    roundsTotal > 0 ? scoring.metrics.rounds_correct / roundsTotal : 0;
  const hintRate =
    roundsTotal > 0 ? (scoring.metrics.hint_count ?? 0) / roundsTotal : 0;

  const completedAt = session.completedAt
    ? new Date(session.completedAt)
    : new Date();

  for (const ms of mappedSkills) {
    const skillId = Number(ms.skillId);
    const key = `${childId}:${skillId}`;
    const prev = replayedMastery.get(key) ?? null;

    const update = computeUpdate({
      prev,
      result: {
        correct_ratio: correctRatio,
        hint_rate: hintRate,
      },
      weight: Number(ms.weight),
      now: completedAt,
    });

    replayedMastery.set(key, {
      child_id: childId,
      skill_id: skillId,
      ...update,
    });
  }

  return true;
}

async function verifyMasteryDiscrepancy(
  db: ReturnType<typeof getOwnerDb>,
  childId: number,
  skillId: number,
  state: MasteryState
): Promise<{ dbPLearn: number; divergence: number } | null> {
  const [dbRow] = await db
    .select()
    .from(masteryState)
    .where(
      and(
        eq(masteryState.childProfileId, childId),
        eq(masteryState.skillId, skillId)
      )
    )
    .limit(1);

  if (!dbRow) {
    return null;
  }

  const dbPLearn = Number(dbRow.pLearn);
  const divergence = Math.abs(dbPLearn - state.p_learn);

  return { dbPLearn, divergence };
}

/**
 * BR-ADP-07, D-MP & spec §7.5
 * Offline Adaptive Replay script to verify BKT state reproducibility from raw telemetry.
 */
export async function runAdaptiveReplay(
  options: ReplayOptions = {}
): Promise<ReplayReport> {
  const db = getOwnerDb();
  const limit = options.sampleLimit ?? 500;

  // 1. Fetch completed sessions with child profiles in chronological order
  const sessions = await db
    .select()
    .from(playSessions)
    .where(
      and(
        eq(playSessions.completionStatus, "completed"),
        eq(playSessions.isPreview, false)
      )
    )
    .orderBy(asc(playSessions.completedAt))
    .limit(limit);

  const replayedMastery = new Map<string, MasteryState>();
  let totalSessions = 0;

  for (const session of sessions) {
    const processed = await replaySingleSession(db, session, replayedMastery);
    if (processed) {
      totalSessions++;
    }
  }

  // 2. Compare against recorded masteryState in DB
  const discrepancies: ReplayReport["discrepancies"] = [];
  let totalDivergence = 0;
  let maxDivergence = 0;
  let evaluatedCount = 0;

  for (const [key, state] of replayedMastery.entries()) {
    const [childIdStr, skillIdStr] = key.split(":");
    const childId = Number(childIdStr);
    const skillId = Number(skillIdStr);

    const check = await verifyMasteryDiscrepancy(db, childId, skillId, state);
    if (check) {
      totalDivergence += check.divergence;
      if (check.divergence > maxDivergence) {
        maxDivergence = check.divergence;
      }

      if (check.divergence > 0.001) {
        discrepancies.push({
          child_id: childId,
          skill_id: skillId,
          db_p_learn: check.dbPLearn,
          replayed_p_learn: state.p_learn,
          divergence: check.divergence,
        });
      }
      evaluatedCount++;
    }
  }

  const meanAbsoluteError =
    evaluatedCount > 0 ? totalDivergence / evaluatedCount : 0;

  return {
    total_sessions_replayed: totalSessions,
    skills_evaluated: evaluatedCount,
    mean_absolute_error: Number(meanAbsoluteError.toFixed(4)),
    max_divergence: Number(maxDivergence.toFixed(4)),
    discrepancies,
  };
}

// Direct CLI invocation
if (process.argv[1]?.includes("replay-adaptive.ts")) {
  runAdaptiveReplay()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (report.discrepancies.length > 0) {
        console.warn(
          `[replay-adaptive] Found ${report.discrepancies.length} discrepancies!`
        );
        process.exit(1);
      } else {
        console.log(
          "[replay-adaptive] All replayed mastery states match cleanly."
        );
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error("[replay-adaptive] Execution error:", err);
      process.exit(1);
    });
}
