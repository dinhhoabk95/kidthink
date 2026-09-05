import type { selectNext } from "@mindkid/adaptive";
import { AppError } from "@mindkid/auth";
import { getOwnerDb, playSessions, telemetryEvents } from "@mindkid/db";
import { getGameTemplate } from "@mindkid/game-engine/registry";
import { enqueue } from "@mindkid/queue";
import {
  computeSessionResult,
  computeStars,
  formatKidSurfaceResponse,
} from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { applySessionMasteryAndBadges } from "./mastery.js";
import {
  checkSessionOwnership,
  type IngestOptions,
} from "./session/ownership.js";

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

  await checkSessionOwnership(db, session, options);

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
    events.map((e: typeof telemetryEvents.$inferSelect) => ({
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

  let nextSuggestion: ReturnType<typeof selectNext> | null = null;
  const templateDef = getGameTemplate(session.templateCode);
  const isTeachTemplate = templateDef?.kind === "teach";

  // Transaction bọc cập nhật trạng thái completed + mastery + badges (#252)
  await db.transaction(async (tx) => {
    const [completed] = await tx
      .update(playSessions)
      .set({
        completionStatus: "completed",
        completedAt: now,
        durationSeconds,
        score: scoringResult.raw_score,
        starsEarned: stars ?? 0,
        updatedAt: now,
      })
      .where(
        and(
          eq(playSessions.id, session.id),
          eq(playSessions.completionStatus, "in_progress")
        )
      )
      .returning({ id: playSessions.id });

    if (!completed) {
      throw new AppError("SESSION_ALREADY_COMPLETED");
    }

    if (session.childProfileId && !session.isPreview && !isTeachTemplate) {
      nextSuggestion = await applySessionMasteryAndBadges({
        db: tx, // Phải dùng tx trong transaction
        childId: Number(session.childProfileId),
        gameLevelId: session.gameLevelId,
        sessionUuid,
        scoringResult,
        now,
      });
    }
  });

  // enqueue nằm ngoài transaction
  try {
    await enqueue("rollup:session", { sessionUuid }, { jobId: sessionUuid });
  } catch (queueErr) {
    console.warn(
      "[completePlaySession] Failed to enqueue rollup job:",
      queueErr
    );
  }

  return {
    ...formatKidSurfaceResponse({
      normalized_score: scoringResult.normalized_score,
      completionStatus: "completed",
      metrics: scoringResult.metrics,
    }),
    next_suggestion: nextSuggestion ?? null,
  };
}
