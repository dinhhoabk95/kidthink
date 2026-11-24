import { getOwnerDb, PLAY_COMPLETION_STATUS } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import {
  computeSessionResult,
  computeStars,
  getDateIct,
  type TelemetryEventInput,
} from "@mindkid/shared";
import { logJobDone } from "#src/log";
import {
  computeNetSessionDurationSeconds,
  rollupChildDailyStatsForWindow,
} from "#src/services/rollup";
import type { Consumer } from "./types.js";

export async function runSessionRollup(
  sessionUuid: string,
  payload?: { sessionUuid?: string }
): Promise<void> {
  const targetUuid = payload?.sessionUuid || sessionUuid;
  if (!targetUuid) {
    throw new Error("Missing sessionUuid in rollup:session job");
  }

  const db = getOwnerDb();
  const repos = createRepositories(db);

  // 1. Fetch play_session
  const session = await repos.playSessions.findByUuid(targetUuid);

  if (!session) {
    console.warn(
      `[rollup:session] Session not found for sessionUuid=${targetUuid}`
    );
    return;
  }

  // 2. Fetch telemetry_events
  const events = await repos.telemetry.listBySession(targetUuid);

  const mappedEvents: TelemetryEventInput[] = events.map((e) => ({
    sessionUuid: e.sessionUuid,
    seq: e.seq,
    eventName: e.eventName,
    occurredAtMs: e.occurredAtMs,
    payload: e.payload,
    clientTimestamp: e.clientTimestamp,
  }));

  // 3. Compute result using pure function (D-GI, BR-TLM-04, BR-HPL-07)
  const result = computeSessionResult(mappedEvents);
  const durationSec = computeNetSessionDurationSeconds(
    session.durationSeconds,
    mappedEvents
  );
  const targetStatus =
    session.completionStatus === PLAY_COMPLETION_STATUS.IN_PROGRESS
      ? PLAY_COMPLETION_STATUS.COMPLETED
      : session.completionStatus;

  const starsStatus =
    targetStatus === PLAY_COMPLETION_STATUS.ABANDONED
      ? "abandoned"
      : "completed";
  const stars = computeStars(result.normalized_score, starsStatus);

  // 4. Update play_sessions if in_progress or if net duration needs sync (BR-HPL-07)
  if (session.completionStatus === PLAY_COMPLETION_STATUS.IN_PROGRESS) {
    await repos.playSessions.completeSession(targetUuid, {
      score: result.raw_score,
      starsEarned: stars ?? 0,
      durationSeconds: durationSec,
      completionStatus: PLAY_COMPLETION_STATUS.COMPLETED,
      completedAt: new Date(),
    });
  } else if (session.durationSeconds !== durationSec) {
    await repos.playSessions.updateSessionDuration(targetUuid, durationSec);
  }

  // 5. Update child_session_summaries & child_daily_stats if childProfileId is present (Idempotent upsert)
  if (session.childProfileId) {
    const childId = Number(session.childProfileId);
    await repos.analyticsRollup.upsertSessionSummary({
      childProfileId: childId,
      sessionUuid: targetUuid,
      gameLevelId: session.gameLevelId,
      templateCode: session.templateCode,
      completionStatus: targetStatus,
      score: result.raw_score,
      durationSeconds: durationSec,
      starsEarned: stars ?? 0,
      hintsUsed: result.metrics.hint_count ?? 0,
      retriesCount: result.metrics.retry_count ?? 0,
      completedAt: session.completedAt,
    });

    const sessionDateIct = getDateIct(session.startedAt);
    await rollupChildDailyStatsForWindow(db, sessionDateIct, childId);
  }

  // D-MH: mastery_state is updated synchronously in completePlaySession transaction.
}

export const rollupSession: Consumer<"rollup:session"> = async (
  payload,
  ctx
) => {
  await runSessionRollup(payload.sessionUuid);
  logJobDone("rollup:session", ctx, { sessionUuid: payload.sessionUuid });
};
