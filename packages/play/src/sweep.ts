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
import { and, eq, inArray, sql } from "drizzle-orm";
import { applyAbandonedSessionMastery } from "#src/mastery";

const DEFAULT_SWEEP_LIMIT = 100;

function isTelemetryPayloadRecord(
  val: typeof telemetryEvents.$inferSelect.payload
): val is NonNullable<TelemetryEventInput["payload"]> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

async function recordAbandonedSessionStats(params: {
  readonly db: ReturnType<typeof getOwnerDb>;
  readonly session: typeof playSessions.$inferSelect;
  readonly playTimeSec: number;
  readonly now: Date;
}): Promise<void> {
  const { db, session, playTimeSec, now } = params;
  if (!session.childProfileId) {
    return;
  }
  const statDate = getDateIct(session.startedAt);
  await db
    .insert(childDailyStats)
    .values({
      childProfileId: Number(session.childProfileId),
      dateIct: statDate,
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

  if (!session.isPreview && session.templateCode !== "GT-000") {
    await applyAbandonedSessionMastery({
      db,
      childId: Number(session.childProfileId),
      gameLevelId: session.gameLevelId,
      now,
    });
  }
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

  if (candidateSessions.length === 0) {
    return 0;
  }

  const sessionUuids = candidateSessions.map((s) => s.sessionUuid);
  const events =
    sessionUuids.length > 0
      ? await db
          .select()
          .from(telemetryEvents)
          .where(inArray(telemetryEvents.sessionUuid, sessionUuids))
          .orderBy(telemetryEvents.seq)
      : [];

  const eventsBySession = new Map<string, typeof events>();
  for (const e of events) {
    const list = eventsBySession.get(e.sessionUuid);
    if (list) {
      list.push(e);
    } else {
      eventsBySession.set(e.sessionUuid, [e]);
    }
  }

  let sweptCount = 0;

  for (const session of candidateSessions) {
    const sessionEvents = eventsBySession.get(session.sessionUuid) ?? [];

    const mappedEvents: TelemetryEventInput[] = sessionEvents.map((e) => ({
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

    await recordAbandonedSessionStats({
      db,
      session,
      playTimeSec,
      now,
    });
  }

  return sweptCount;
}
