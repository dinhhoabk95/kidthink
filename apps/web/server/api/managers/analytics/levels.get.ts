import { getOwnerDb, levelDailyStats } from "@mindkid/db";
import { and, desc, gte, lte, type SQL } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export const CONTENT_KPI_THRESHOLDS = {
  HIGH_ABANDONMENT_RATE: 0.4, // > 40%
  LOW_ACCURACY_RATE: 0.3, // < 30%
  LOW_PLAY_COUNT: 5, // < 5 plays/week
  LOW_ACTIVITY_COUNT: 3, // < 3 activities
} as const;

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const query = getQuery(event);

  const from = typeof query.from === "string" ? query.from : undefined;
  const to = typeof query.to === "string" ? query.to : undefined;
  const rawLimit = query.limit ? Number(query.limit) : 50;
  // BR-PRF-06: Cap limit at server maximum of 100
  const limit = Math.min(
    Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 50),
    100
  );

  const db = getOwnerDb();
  const conditions: SQL[] = [];

  if (from) {
    conditions.push(gte(levelDailyStats.dateIct, from));
  }
  if (to) {
    conditions.push(lte(levelDailyStats.dateIct, to));
  }

  const rows = await db
    .select()
    .from(levelDailyStats)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(levelDailyStats.dateIct))
    .limit(limit);

  // Compute metrics & flags §7.2
  const items = rows.map((row) => {
    const total = row.playsCount || 0;
    const abandonRate = total > 0 ? row.abandonedCount / total : 0;
    const completionRate = total > 0 ? row.completionsCount / total : 0;

    return {
      level_code: row.levelCode,
      content_version: row.contentVersion,
      date_ict: row.dateIct,
      plays_count: row.playsCount,
      completions_count: row.completionsCount,
      abandoned_count: row.abandonedCount,
      avg_duration_seconds: row.avgDurationSeconds,
      avg_hints_used: row.avgHintsUsed,
      kpi_alerts: {
        high_abandonment:
          abandonRate > CONTENT_KPI_THRESHOLDS.HIGH_ABANDONMENT_RATE,
        low_accuracy: completionRate < CONTENT_KPI_THRESHOLDS.LOW_ACCURACY_RATE,
        low_plays: total < CONTENT_KPI_THRESHOLDS.LOW_PLAY_COUNT,
      },
    };
  });

  return {
    items,
    count: items.length,
    limit,
  };
});
