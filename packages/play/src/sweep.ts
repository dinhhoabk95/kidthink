import {
  getOwnerDb,
  type PlaySessionEntity,
  type TelemetryEventEntity,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import {
  computeAbandonedSessionDurationSeconds,
  getDateIct,
  type TelemetryEventInput,
} from "@mindkid/shared";
import { applyAbandonedSessionMastery } from "#src/mastery";
import type { DbOrTx } from "#src/types";

const DEFAULT_SWEEP_LIMIT = 100;

async function recordAbandonedSessionStats(params: {
  readonly db: DbOrTx;
  readonly session: PlaySessionEntity;
  readonly playTimeSec: number;
  readonly now: Date;
}): Promise<void> {
  const { db, session, playTimeSec, now } = params;
  if (!session.childProfileId) {
    return;
  }
  const repos = createRepositories(db);
  const statDate = getDateIct(session.startedAt);
  await repos.analyticsRollup.incrementAbandonedPlayStats(
    Number(session.childProfileId),
    statDate,
    playTimeSec,
    now
  );

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
  const repos = createRepositories(db);
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const candidateSessions = await repos.playSessions.listStaleInProgress(
    thirtyMinsAgo,
    limit
  );

  if (candidateSessions.length === 0) {
    return 0;
  }

  const sessionUuids = candidateSessions.map((s) => s.sessionUuid);
  const events =
    sessionUuids.length > 0
      ? await repos.telemetry.listBySessions(sessionUuids)
      : [];

  const eventsBySession = new Map<string, TelemetryEventEntity[]>();
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
      payload: e.payload,
      clientTimestamp: e.clientTimestamp,
    }));

    const playTimeSec =
      mappedEvents.length > 0
        ? computeAbandonedSessionDurationSeconds(
            mappedEvents,
            session.startedAt
          )
        : Math.max(0, session.durationSeconds ?? 0);

    const updatedRow = await repos.playSessions.abandonExpiredById(
      session.id,
      playTimeSec,
      now
    );

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
