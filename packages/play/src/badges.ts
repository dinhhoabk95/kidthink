import { evaluateBadges } from "@mindkid/adaptive";
import { childBadges, childDailyStats } from "@mindkid/db";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "./types.js";

export async function awardChildBadges(params: {
  readonly db: DbOrTx;
  readonly childId: number;
  readonly sessionUuid: string;
  readonly now: Date;
}): Promise<void> {
  const { db, childId, sessionUuid, now } = params;
  const existingBadgesRows = await db
    .select({ badgeCode: childBadges.badgeCode })
    .from(childBadges)
    .where(eq(childBadges.childProfileId, childId));
  const existingBadgeCodes = new Set<string>(
    existingBadgesRows.map((b: { badgeCode: string }) => b.badgeCode)
  );

  const dailyStatsRows = await db
    .select({ dateIct: childDailyStats.dateIct })
    .from(childDailyStats)
    .where(eq(childDailyStats.childProfileId, childId));
  const distinctDays = new Set(
    dailyStatsRows.map((d: { dateIct: string }) => d.dateIct)
  ).size;

  const newBadges = evaluateBadges({
    distinctPlayDays: distinctDays,
    existingBadgeCodes,
  });

  for (const badgeCode of newBadges) {
    await db
      .insert(childBadges)
      .values({
        childProfileId: childId,
        badgeCode,
        awardedAt: now,
        sourceRef: sessionUuid,
      })
      .onConflictDoNothing();
  }
}
