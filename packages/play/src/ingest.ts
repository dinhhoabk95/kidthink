import {
  type CreateTelemetryEventInput,
  getOwnerDb,
  PLAY_COMPLETION_STATUS,
  type PlaySessionEntity,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { NotFoundError } from "@mindkid/errors/common";
import { cleanEventPayload } from "#src/events/sanitize";
import {
  type IngestEventItem,
  validateBatchPayload,
  validateSequenceNumbers,
  validateTelemetryEventRecord,
} from "#src/events/validate";
import {
  checkSessionOwnership,
  type IngestOptions,
} from "#src/session/ownership";
import type { DbOrTx } from "#src/types";

function normalizeOccurredAtMs(
  rawMs: number | undefined,
  startedAt: Date | null | undefined
): number | null {
  if (typeof rawMs !== "number") {
    return null;
  }
  let ms = rawMs;
  if (ms > 1_000_000_000_000 && startedAt) {
    ms = Math.max(0, Math.round(ms - new Date(startedAt).getTime()));
  }
  if (ms > 2_147_483_647) {
    return 2_147_483_647;
  }
  return ms < 0 ? 0 : ms;
}

function resolveClientTimestamp(
  clientTs: string | undefined,
  rawOccurredAtMs: number | undefined
): Date | null {
  if (clientTs) {
    return new Date(clientTs);
  }
  if (
    typeof rawOccurredAtMs === "number" &&
    rawOccurredAtMs > 1_000_000_000_000
  ) {
    return new Date(rawOccurredAtMs);
  }
  return null;
}

export async function insertIngestedEventsBatch(
  db: DbOrTx,
  sessionUuid: string,
  session: PlaySessionEntity,
  childUuid: string | null,
  events: readonly IngestEventItem[],
  existingSeqs: Set<number>,
  initialMaxSeq: number
): Promise<{ accepted: number; skipped: number; newMaxSeq: number }> {
  const seenBatchSeqs = new Set<number>();
  const toInsert: CreateTelemetryEventInput[] = [];
  let skipped = 0;
  let newMaxSeq = initialMaxSeq;

  for (const ev of events) {
    if (existingSeqs.has(ev.seq) || seenBatchSeqs.has(ev.seq)) {
      skipped++;
      continue;
    }
    seenBatchSeqs.add(ev.seq);

    const occurredAtMs = normalizeOccurredAtMs(
      ev.occurred_at_ms,
      session.startedAt
    );
    const clientTimestamp = resolveClientTimestamp(
      ev.client_timestamp,
      ev.occurred_at_ms
    );
    const cleanedPayload = cleanEventPayload(ev.event_name, ev.payload);

    validateTelemetryEventRecord({
      session_uuid: sessionUuid,
      seq: ev.seq,
      event_name: ev.event_name,
      occurred_at_ms: occurredAtMs,
      payload: cleanedPayload,
      client_timestamp: clientTimestamp,
    });

    toInsert.push({
      sessionUuid,
      seq: ev.seq,
      childUuid,
      gameLevelId: session.gameLevelId,
      templateCode: session.templateCode,
      eventName: ev.event_name,
      occurredAtMs,
      payload: cleanedPayload,
      clientTimestamp,
    });
  }

  if (toInsert.length === 0) {
    return { accepted: 0, skipped, newMaxSeq };
  }

  const repos = createRepositories(db);
  const insertedSeqList =
    await repos.telemetry.insertBatchReturningSeqs(toInsert);

  const insertedSeqs = new Set<number>(insertedSeqList);
  const accepted = insertedSeqList.length;
  skipped += toInsert.length - accepted;

  for (const seq of insertedSeqs) {
    existingSeqs.add(seq);
    if (seq > newMaxSeq) {
      newMaxSeq = seq;
    }
  }

  return { accepted, skipped, newMaxSeq };
}

export async function ingestPlayEvents(
  sessionUuid: string,
  events: readonly IngestEventItem[],
  options: IngestOptions = {}
): Promise<{ accepted: number; skipped: number; last_seq: number }> {
  validateBatchPayload(events);
  if (!Array.isArray(events) || events.length === 0) {
    return { accepted: 0, skipped: 0, last_seq: 0 };
  }

  const db = getOwnerDb();
  const repos = createRepositories(db);
  const session = await repos.playSessions.findByUuid(sessionUuid);
  if (!session) {
    throw new NotFoundError();
  }

  await checkSessionOwnership(db, session, options);

  const existingSeqList = await repos.telemetry.listSeqsBySession(sessionUuid);

  const existingSeqs = new Set<number>(existingSeqList);
  const currentMaxSeq = existingSeqList[0] ?? 0;

  if (
    session.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED ||
    session.completionStatus === PLAY_COMPLETION_STATUS.ABANDONED
  ) {
    return {
      accepted: 0,
      skipped: events.length,
      last_seq: currentMaxSeq,
    };
  }

  validateSequenceNumbers(events, currentMaxSeq, existingSeqs);

  let childUuid: string | null = null;
  if (session.childProfileId) {
    const cp = await repos.childProfiles.findById(session.childProfileId);
    if (cp) {
      childUuid = cp.uuid;
    }
  }

  const batchResult = await insertIngestedEventsBatch(
    db,
    sessionUuid,
    session,
    childUuid,
    events,
    existingSeqs,
    currentMaxSeq
  );

  return {
    accepted: batchResult.accepted,
    skipped: batchResult.skipped,
    last_seq: batchResult.newMaxSeq,
  };
}
