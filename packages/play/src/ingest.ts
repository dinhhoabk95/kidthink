import {
  childProfiles,
  getOwnerDb,
  playSessions,
  telemetryEvents,
} from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { desc, eq } from "drizzle-orm";
import { cleanEventPayload } from "./events/sanitize.js";
import {
  type IngestEventItem,
  validateBatchPayload,
  validateSequenceNumbers,
} from "./events/validate.js";
import {
  checkSessionOwnership,
  type IngestOptions,
} from "./session/ownership.js";
import type { DbOrTx } from "./types.js";

export async function insertIngestedEventsBatch(
  db: DbOrTx,
  sessionUuid: string,
  session: typeof playSessions.$inferSelect,
  childUuid: string | null,
  events: readonly IngestEventItem[],
  existingSeqs: Set<number>,
  initialMaxSeq: number
): Promise<{ accepted: number; skipped: number; newMaxSeq: number }> {
  const seenBatchSeqs = new Set<number>();
  const toInsert: (typeof telemetryEvents.$inferInsert)[] = [];
  let skipped = 0;
  let newMaxSeq = initialMaxSeq;

  for (const ev of events) {
    if (existingSeqs.has(ev.seq) || seenBatchSeqs.has(ev.seq)) {
      skipped++;
      continue;
    }
    seenBatchSeqs.add(ev.seq);
    toInsert.push({
      sessionUuid,
      seq: ev.seq,
      childUuid,
      gameLevelId: session.gameLevelId,
      contentVersion: session.contentVersion,
      templateCode: session.templateCode,
      eventName: ev.event_name,
      occurredAtMs: ev.occurred_at_ms ?? null,
      payload: cleanEventPayload(ev.event_name, ev.payload),
      clientTimestamp: ev.client_timestamp
        ? new Date(ev.client_timestamp)
        : null,
    });
  }

  if (toInsert.length === 0) {
    return { accepted: 0, skipped, newMaxSeq };
  }

  const insertedRows = await db
    .insert(telemetryEvents)
    .values(toInsert)
    .onConflictDoNothing()
    .returning({ seq: telemetryEvents.seq });

  const insertedSeqs = new Set<number>(
    insertedRows.map((r: { seq: number }) => r.seq)
  );
  const accepted = insertedRows.length;
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
  const sessionRows = await db
    .select()
    .from(playSessions)
    .where(eq(playSessions.sessionUuid, sessionUuid))
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    throw new NotFoundError();
  }

  await checkSessionOwnership(db, session, options);

  const existingEvents = await db
    .select({ seq: telemetryEvents.seq })
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, sessionUuid))
    .orderBy(desc(telemetryEvents.seq));

  const existingSeqs = new Set<number>(
    existingEvents.map((e: { seq: number }) => e.seq)
  );
  const currentMaxSeq = existingEvents[0]?.seq ?? 0;

  if (
    session.completionStatus === "completed" ||
    session.completionStatus === "abandoned"
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
    const cp = await db
      .select({ uuid: childProfiles.uuid })
      .from(childProfiles)
      .where(eq(childProfiles.id, session.childProfileId))
      .limit(1);
    if (cp[0]) {
      childUuid = cp[0].uuid;
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
