import { childDailyStats, getOwnerDb, playSessions } from "@mindkid/db";
import { and, eq, sql } from "drizzle-orm";
import { applyAbandonedSessionMastery } from "./mastery.js";

const DEFAULT_SWEEP_LIMIT = 100;

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
  const dateIctStr = now.toISOString().slice(0, 10);

  for (const session of candidateSessions) {
    const [updatedRow] = await db
      .update(playSessions)
      .set({
        completionStatus: "abandoned",
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
