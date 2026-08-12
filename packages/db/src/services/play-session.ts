import { AppError } from "@kidthink/auth";
import { enqueue } from "@kidthink/queue";
import { computeSessionResult, computeStars } from "@kidthink/shared";
import { and, desc, eq, sql } from "drizzle-orm";
import { getOwnerDb } from "../client.ts";
import { childProfiles } from "../schema/child.ts";

import {
  childDailyStats,
  playSessions,
  telemetryEvents,
} from "../schema/play.ts";

export const ALLOWED_EVENT_NAMES = new Set([
  "game_started",
  "instruction_viewed",
  "game_paused",
  "game_resumed",
  "game_completed",
  "game_abandoned",
  "round_started",
  "question_shown",
  "answer_selected",
  "answer_correct",
  "answer_incorrect",
  "round_completed",
  "round_retried",
  "round_skipped",
  "hint_requested",
  "scaffold_escalated",
  "demo_shown",
  "asset_load_failed",
  "fps_sample",
  "parent_gate_shown",
  "parent_gate_passed",
  "parent_gate_failed",
]);

const PII_FIELDS = new Set([
  "display_name",
  "birth_year",
  "user_id",
  "email",
  "ip",
  "score",
]);

export interface MasteryEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function checkMasteryEligibility(params: {
  childProfileId: number | null | bigint;
  isPreview: boolean;
  completionStatus: string;
  levelHasSkills: boolean;
}): MasteryEligibilityResult {
  if (params.childProfileId === null || params.childProfileId === undefined) {
    return {
      eligible: false,
      reason: "BR-PSL-04: Guest session has no child profile",
    };
  }

  if (params.isPreview) {
    return {
      eligible: false,
      reason: "BR-PSL-05: Preview session does not update mastery",
    };
  }

  if (params.completionStatus !== "completed") {
    return { eligible: false, reason: "Session is not completed" };
  }

  if (!params.levelHasSkills) {
    return { eligible: false, reason: "Level has no skills attached" };
  }

  return { eligible: true };
}

export interface IngestEventItem {
  seq: number;
  event_name: string;
  occurred_at_ms?: number;
  payload?: Record<string, unknown>;
  client_timestamp?: string;
}

export interface IngestOptions {
  callerChildProfileId?: number | null;
  guestDeviceId?: string;
  isUserCall?: boolean;
  accountChildIds?: number[];
}

function validateBatchPayload(events: IngestEventItem[]) {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  if (events.length > 100) {
    throw new AppError("BATCH_TOO_LARGE");
  }

  const payloadSize = JSON.stringify(events).length;
  if (payloadSize > 64 * 1024) {
    throw new AppError("PAYLOAD_TOO_LARGE");
  }

  for (const ev of events) {
    if (!ALLOWED_EVENT_NAMES.has(ev.event_name)) {
      throw new AppError("UNKNOWN_EVENT_NAME");
    }
  }
}

function checkUserSessionOwnership(
  session: typeof playSessions.$inferSelect,
  options: IngestOptions
) {
  if (!session.childProfileId) {
    throw new AppError("NOT_FOUND");
  }
  if (
    options.callerChildProfileId !== undefined &&
    options.callerChildProfileId !== null &&
    Number(session.childProfileId) !== Number(options.callerChildProfileId)
  ) {
    throw new AppError("NOT_FOUND");
  }
  if (
    options.accountChildIds &&
    options.accountChildIds.length > 0 &&
    !options.accountChildIds.includes(Number(session.childProfileId))
  ) {
    throw new AppError("NOT_FOUND");
  }
}

function checkSessionOwnership(
  session: typeof playSessions.$inferSelect,
  options: IngestOptions
) {
  if (options.isUserCall) {
    checkUserSessionOwnership(session, options);
  } else if (
    session.childProfileId !== null &&
    session.childProfileId !== undefined
  ) {
    throw new AppError("NOT_FOUND");
  }
}

function cleanEventPayload(
  payload?: Record<string, unknown>
): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  if (payload && typeof payload === "object") {
    for (const [key, value] of Object.entries(payload)) {
      if (!PII_FIELDS.has(key.toLowerCase())) {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

function validateSequenceNumbers(
  events: IngestEventItem[],
  currentMaxSeq: number,
  existingSeqs: Set<number>
) {
  for (const ev of events) {
    if (ev.seq < 1) {
      throw new AppError("INVALID_SEQUENCE");
    }
    if (ev.seq < currentMaxSeq && !existingSeqs.has(ev.seq)) {
      throw new AppError("EVENT_OUT_OF_ORDER");
    }
  }
}

async function insertIngestedEventsBatch(
  db: ReturnType<typeof getOwnerDb>,
  sessionUuid: string,
  session: typeof playSessions.$inferSelect,
  childUuid: string | null,
  events: IngestEventItem[],
  existingSeqs: Set<number>,
  initialMaxSeq: number
): Promise<{ accepted: number; skipped: number; newMaxSeq: number }> {
  let accepted = 0;
  let skipped = 0;
  let newMaxSeq = initialMaxSeq;

  for (const ev of events) {
    if (existingSeqs.has(ev.seq)) {
      skipped++;
      continue;
    }

    try {
      await db
        .insert(telemetryEvents)
        .values({
          sessionUuid,
          seq: ev.seq,
          childUuid,
          gameLevelId: session.gameLevelId,
          contentVersion: session.contentVersion,
          templateId: session.templateId,
          eventName: ev.event_name,
          occurredAtMs: ev.occurred_at_ms ?? null,
          payload: cleanEventPayload(ev.payload),
          clientTimestamp: ev.client_timestamp
            ? new Date(ev.client_timestamp)
            : null,
        })
        .onConflictDoNothing();

      accepted++;
      existingSeqs.add(ev.seq);
      if (ev.seq > newMaxSeq) {
        newMaxSeq = ev.seq;
      }
    } catch {
      skipped++;
    }
  }

  return { accepted, skipped, newMaxSeq };
}

export async function ingestPlayEvents(
  sessionUuid: string,
  events: IngestEventItem[],
  options: IngestOptions = {}
) {
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
    throw new AppError("NOT_FOUND");
  }

  checkSessionOwnership(session, options);

  const existingEvents = await db
    .select({ seq: telemetryEvents.seq })
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, sessionUuid))
    .orderBy(desc(telemetryEvents.seq));

  const existingSeqs = new Set(existingEvents.map((e) => e.seq));
  const currentMaxSeq = existingEvents.length > 0 ? existingEvents[0].seq : 0;

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

export async function completePlaySession(
  sessionUuid: string,
  _lastSeq?: number,
  options: IngestOptions = {}
) {
  const db = getOwnerDb();

  const sessionRows = await db
    .select()
    .from(playSessions)
    .where(eq(playSessions.sessionUuid, sessionUuid))
    .limit(1);

  const session = sessionRows[0];
  if (!session) {
    throw new AppError("NOT_FOUND");
  }

  checkSessionOwnership(session, options);

  if (
    session.completionStatus === "completed" ||
    session.completionStatus === "abandoned"
  ) {
    throw new AppError("SESSION_ALREADY_COMPLETED");
  }

  const now = new Date();
  const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();
  if (elapsedMs > 4 * 60 * 60 * 1000) {
    await db
      .update(playSessions)
      .set({ completionStatus: "abandoned", updatedAt: now })
      .where(eq(playSessions.id, session.id));

    throw new AppError("SESSION_EXPIRED");
  }

  const events = await db
    .select()
    .from(telemetryEvents)
    .where(eq(telemetryEvents.sessionUuid, sessionUuid))
    .orderBy(telemetryEvents.seq);

  const scoringResult = computeSessionResult(
    events.map((e) => ({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: e.payload as Record<string, unknown> | null,
      clientTimestamp: e.clientTimestamp,
    }))
  );

  const durationSeconds = Math.round(scoringResult.metrics.duration_ms / 1000);
  const stars = computeStars(scoringResult.normalized_score, "completed");

  await db
    .update(playSessions)
    .set({
      completionStatus: "completed",
      completedAt: now,
      durationSeconds,
      score: scoringResult.raw_score,
      starsEarned: stars ?? 0,
      updatedAt: now,
    })
    .where(eq(playSessions.id, session.id));

  try {
    await enqueue("rollup:session", { sessionUuid }, { jobId: sessionUuid });
  } catch (queueErr) {
    console.warn(
      "[completePlaySession] Failed to enqueue rollup job:",
      queueErr
    );
  }

  return {
    score: null,
    normalized_score: null,
    stars: null,
    rounds_correct: scoringResult.metrics.rounds_correct ?? 0,
    rounds_total: scoringResult.metrics.rounds_total ?? 0,
  };
}

export async function sweepAbandonedSessions(now = new Date()) {
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
    );

  let sweptCount = 0;
  const dateIctStr = now.toISOString().slice(0, 10);

  for (const session of candidateSessions) {
    await db
      .update(playSessions)
      .set({
        completionStatus: "abandoned",
        updatedAt: now,
      })
      .where(eq(playSessions.id, session.id));

    sweptCount++;

    if (session.childProfileId) {
      const playTimeSec = session.durationSeconds || 1800;
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
    }
  }

  return sweptCount;
}
