import {
  childSessionSummaries,
  getOwnerDb,
  playSessions,
  telemetryEvents,
} from "@kidthink/db";
import {
  computeSessionResult,
  computeStars,
  masteryGuard,
} from "@kidthink/shared";
import { eq, sql } from "drizzle-orm";

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

  // 4. Update play_sessions if in_progress (BR-SPT-07 prevents updating terminal sessions)
  if (session.completionStatus === "in_progress") {
    const targetStatus = "completed";
    const stars = computeStars(result.normalized_score, targetStatus);

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
    const sessionDate = (session.completedAt || session.startedAt || new Date())
      .toISOString()
      .slice(0, 10);

    const isCompleted =
      session.completionStatus === "completed" ||
      session.completionStatus === "in_progress";

    await db
      .insert(childSessionSummaries)
      .values({
        childProfileId: session.childProfileId,
        date: sessionDate,
        totalPlayTimeSeconds: durationSec,
        levelsCompleted: isCompleted ? 1 : 0,
      })
      .onConflictDoUpdate({
        target: [
          childSessionSummaries.childProfileId,
          childSessionSummaries.date,
        ],
        set: {
          totalPlayTimeSeconds: sql`${childSessionSummaries.totalPlayTimeSeconds} + ${durationSec}`,
          levelsCompleted: sql`${childSessionSummaries.levelsCompleted} + ${
            isCompleted ? 1 : 0
          }`,
          updatedAt: new Date(),
        },
      });
  }

  // 6. Invoke mastery guard (D-GH)
  const canUpdateMastery = masteryGuard({
    childProfileId: session.childProfileId,
    isPreview: session.isPreview,
    completionStatus: session.completionStatus,
    hasSkills: false, // At P1 mastery is not written yet
  });

  if (canUpdateMastery) {
    // Stub for P3 mastery update
  }
}
