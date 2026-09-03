import {
  childSessionSummaries,
  getOwnerDb,
  playSessions,
  telemetryEvents,
} from "@mindkid/db";
import { computeSessionResult, computeStars } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { logJobDone } from "#src/log";
import type { Consumer } from "./types.js";

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

  // 3. Compute result using pure function (D-GI, BR-TLM-04)
  const result = computeSessionResult(
    events.map((e) => ({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: e.payload as Record<string, unknown> | null,
      clientTimestamp: e.clientTimestamp,
    }))
  );

  const durationSec = Math.round(result.metrics.duration_ms / 1000);
  const targetStatus =
    session.completionStatus === "in_progress"
      ? "completed"
      : session.completionStatus;

  const stars = computeStars(result.normalized_score, targetStatus);

  // 4. Update play_sessions if in_progress (BR-SPT-07 prevents updating terminal sessions)
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
  }

  // 5. Update child_session_summaries if childProfileId is present (Idempotent upsert)
  if (session.childProfileId) {
    await upsertChildSessionSummary(db, {
      childProfileId: session.childProfileId,
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
