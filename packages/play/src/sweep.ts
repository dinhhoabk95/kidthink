import {
  childDailyStats,
  getOwnerDb,
  playSessions,
  telemetryEvents,
} from "@mindkid/db";
import {
  computeAbandonedSessionDurationSeconds,
  getDateIct,
  type TelemetryEventInput,
} from "@mindkid/shared";
import { and, eq, sql } from "drizzle-orm";
import { applyAbandonedSessionMastery } from "#src/mastery";

const DEFAULT_SWEEP_LIMIT = 100;

function isTelemetryPayloadRecord(
  val: typeof telemetryEvents.$inferSelect.payload
): val is NonNullable<TelemetryEventInput["payload"]> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

export async function sweepAbandonedSessions(
  now = new Date(),
  limit = DEFAULT_SWEEP_LIMIT
): Promise<number> {
  const db = getOwnerDb();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const candidateSessions = await db
    .select()
    .from(playSessions)
    .where(
      and(
        eq(playSessions.completionStatus, "in_progress"),
        sql`${playSessions.startedAt} <= ${thirtyMinsAgo.toISOString()}::timestamptz`
      )
    )
    .limit(limit);

  let sweptCount = 0;
  const dateIctStr = getDateIct(now);

  for (const session of candidateSessions) {
    const events = await db
      .select()
      .from(telemetryEvents)
      .where(eq(telemetryEvents.sessionUuid, session.sessionUuid))
      .orderBy(telemetryEvents.seq);

    const mappedEvents: TelemetryEventInput[] = events.map((e) => ({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: isTelemetryPayloadRecord(e.payload) ? e.payload : null,
      clientTimestamp: e.clientTimestamp,
    }));

    const playTimeSec =
      mappedEvents.length > 0
        ? computeAbandonedSessionDurationSeconds(
            mappedEvents,
            session.startedAt
          )
        : Math.max(0, session.durationSeconds ?? 0);

    const [updatedRow] = await db
      .update(playSessions)
      .set({
        completionStatus: "abandoned",
        durationSeconds: playTimeSec,
        updatedAt: now,
      })
      .where(
        and(
          eq(playSessions.id, session.id),
          eq(playSessions.completionStatus, "in_progress")
        )
      )
      .returning({ id: playSessions.id });

    if (!updatedRow) {
      continue;
    }

    sweptCount++;

    if (session.childProfileId) {
      await db
        .insert(childDailyStats)
        .values({
          childProfileId: Number(session.childProfileId),
          dateIct: dateIctStr,
          totalPlayTimeSeconds: playTimeSec,
          levelsAttempted: 1,
          levelsCompleted: 0,
          starsEarned: 0,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [childDailyStats.childProfileId, childDailyStats.dateIct],
          set: {
            totalPlayTimeSeconds: sql`${childDailyStats.totalPlayTimeSeconds} + ${playTimeSec}`,
            levelsAttempted: sql`${childDailyStats.levelsAttempted} + 1`,
            updatedAt: now,
          },
        });

      await applyAbandonedSessionMastery({
        db,
        childId: Number(session.childProfileId),
        gameLevelId: session.gameLevelId,
        now,
      });
    }
  }

  return sweptCount;
}
