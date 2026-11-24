import type { selectNext } from "@mindkid/adaptive";
import {
  getOwnerDb,
  PLAY_COMPLETION_STATUS,
  type TelemetryEventEntity,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { NotFoundError } from "@mindkid/errors/common";
import {
  SessionAlreadyCompletedError,
  SessionExpiredError,
} from "@mindkid/errors/play";
import { getGameTemplate } from "@mindkid/game-engine/registry";
import { enqueue } from "@mindkid/queue";
import {
  computeSessionResult,
  computeStars,
  formatKidSurfaceResponse,
} from "@mindkid/shared";
import { applySessionMasteryAndBadges } from "#src/mastery";
import {
  checkSessionOwnership,
  type IngestOptions,
} from "#src/session/ownership";

export async function completePlaySession(
  sessionUuid: string,
  _lastSeq?: number,
  options: IngestOptions = {}
) {
  const db = getOwnerDb();
  const repos = createRepositories(db);

  const session = await repos.playSessions.findByUuid(sessionUuid);
  if (!session) {
    throw new NotFoundError();
  }

  await checkSessionOwnership(db, session, options);

  if (
    session.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED ||
    session.completionStatus === PLAY_COMPLETION_STATUS.ABANDONED
  ) {
    throw new SessionAlreadyCompletedError();
  }

  const now = new Date();
  const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();
  if (elapsedMs > 4 * 60 * 60 * 1000) {
    await repos.playSessions.abandonExpiredById(
      session.id,
      session.durationSeconds ?? 0,
      now
    );

    throw new SessionExpiredError();
  }

  const events = await repos.telemetry.listBySession(sessionUuid);

  const scoringResult = computeSessionResult(
    events.map((e: TelemetryEventEntity) => ({
      sessionUuid: e.sessionUuid,
      seq: e.seq,
      eventName: e.eventName,
      occurredAtMs: e.occurredAtMs,
      payload: e.payload,
      clientTimestamp: e.clientTimestamp,
    }))
  );

  const durationSeconds = Math.round(scoringResult.metrics.duration_ms / 1000);
  const stars = computeStars(scoringResult.normalized_score, "completed");

  let nextSuggestion: ReturnType<typeof selectNext> | null = null;
  const templateDef = getGameTemplate(session.templateCode);
  const isTeachTemplate = templateDef?.kind === "teach";

  // Transaction bọc cập nhật trạng thái completed + mastery + badges (#252)
  await repos.playSessions.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const completed = await txRepos.playSessions.completeSession(sessionUuid, {
      completionStatus: PLAY_COMPLETION_STATUS.COMPLETED,
      completedAt: now,
      durationSeconds,
      score: scoringResult.raw_score,
      starsEarned: stars ?? 0,
    });

    if (!completed) {
      throw new SessionAlreadyCompletedError();
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
