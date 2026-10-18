import {
  childSessionSummaries,
  getOwnerDb,
  playSessions,
  telemetryEvents,
} from "@mindkid/db";
import {
  computeSessionResult,
  computeStars,
  getDateIct,
  type TelemetryEventInput,
} from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { logJobDone } from "#src/log";
import {
  computeNetSessionDurationSeconds,
  rollupChildDailyStatsForWindow,
} from "#src/services/rollup";
import type { Consumer } from "./types.js";

function isPayloadRecord(
  val: typeof telemetryEvents.$inferSelect.payload
): val is NonNullable<TelemetryEventInput["payload"]> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

async function upsertChildSessionSummary(
  db: ReturnType<typeof getOwnerDb>,
  params: {
    childProfileId: number;
    sessionUuid: string;
    gameLevelId: number;
    contentVersion: number;
    templateCode: string;
    targetStatus: string;
    rawScore: number;
    durationSec: number;
    stars: number;
    hintCount: number;
    retryCount: number;
    completedAt?: Date | null;
  }
) {
  await db
    .insert(childSessionSummaries)
    .values({
      childProfileId: params.childProfileId,
      sessionUuid: params.sessionUuid,
      gameLevelId: params.gameLevelId,
      contentVersion: params.contentVersion,
      templateCode: params.templateCode,
      completionStatus: params.targetStatus,
      score: params.rawScore,
      durationSeconds: params.durationSec,
      starsEarned: params.stars,
      hintsUsed: params.hintCount,
      retriesCount: params.retryCount,
      completedAt: params.completedAt || new Date(),
    })
    .onConflictDoUpdate({
      target: [
        childSessionSummaries.childProfileId,
        childSessionSummaries.sessionUuid,
      ],
      set: {
        completionStatus: params.targetStatus,
        score: params.rawScore,
        durationSeconds: params.durationSec,
        starsEarned: params.stars,
        hintsUsed: params.hintCount,
        retriesCount: params.retryCount,
        completedAt: params.completedAt || new Date(),
      },
    });
}

export async function runSessionRollup(
  sessionUuid: string,
  payload?: { sessionUuid?: string }
): Promise<void> {
  const targetUuid = payload?.sessionUuid || sessionUuid;
  if (!targetUuid) {
    throw new Error("Missing sessionUuid in rollup:session job");
  }

  const db = getOwnerDb();

  // 1. Fetch play_session
  const [session] = await db
    .select()
    .from(playSessions)
    .where(eq(playSessions.sessionUuid, targetUuid));

  if (!session) {
    console.warn(
      `[rollup:session] Session not found for sessionUuid=${targetUuid}`
    );
    return;
  }

  // 2. Fetch telemetry_events
  const events = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, targetUuid))
    .orderBy(telemetryEvents.seq);

  const mappedEvents: TelemetryEventInput[] = events.map((e) => ({
    sessionUuid: e.sessionUuid,
    seq: e.seq,
    eventName: e.eventName,
    occurredAtMs: e.occurredAtMs,
    payload: isPayloadRecord(e.payload) ? e.payload : null,
    clientTimestamp: e.clientTimestamp,
  }));

  // 3. Compute result using pure function (D-GI, BR-TLM-04, BR-HPL-07)
  const result = computeSessionResult(mappedEvents);
  const durationSec = computeNetSessionDurationSeconds(
    session.durationSeconds,
    mappedEvents
  );
  const targetStatus =
    session.completionStatus === "in_progress"
      ? "completed"
      : session.completionStatus;

  const stars = computeStars(result.normalized_score, targetStatus);

  // 4. Update play_sessions if in_progress or if net duration needs sync (BR-HPL-07)
  if (session.completionStatus === "in_progress") {
    await db
      .update(playSessions)
      .set({
        score: result.raw_score,
        starsEarned: stars ?? 0,
        durationSeconds: durationSec,
        completionStatus: targetStatus,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(playSessions.sessionUuid, targetUuid));
  } else if (session.durationSeconds !== durationSec) {
    await db
      .update(playSessions)
      .set({
        durationSeconds: durationSec,
        updatedAt: new Date(),
      })
      .where(eq(playSessions.sessionUuid, targetUuid));
  }

  // 5. Update child_session_summaries & child_daily_stats if childProfileId is present (Idempotent upsert)
  if (session.childProfileId) {
    const childId = Number(session.childProfileId);
    await upsertChildSessionSummary(db, {
      childProfileId: childId,
      sessionUuid: targetUuid,
      gameLevelId: session.gameLevelId,
      contentVersion: session.contentVersion,
      templateCode: session.templateCode,
      targetStatus,
      rawScore: result.raw_score,
      durationSec,
      stars: stars ?? 0,
      hintCount: result.metrics.hint_count ?? 0,
      retryCount: result.metrics.retry_count ?? 0,
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
