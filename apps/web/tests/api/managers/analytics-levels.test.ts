import { getOwnerDb, levelDailyStats, managers } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import levelsAnalyticsHandler from "../../../server/api/managers/analytics/levels.get.ts";

function mockEvent(
  managerContext?: {
    id: number;
    displayName: string;
    role: "super_admin" | "content_reviewer";
    version: number;
  },
  url = "/api/managers/analytics/levels"
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method: "GET",
    path: url,
    node: { req: { headers: {}, url }, res: {} },
    context: {
      ...(managerContext
        ? {
            manager: {
              manager_id: managerContext.id,
              display_name: managerContext.displayName,
              session_id: "m_session_analytics",
              refresh_token_version: managerContext.version,
              role: managerContext.role,
            },
          }
        : {}),
    },
    responseHeaders,
  } as any;
}

describe("Task 7 — GET /api/managers/analytics/levels (BR-TLM-01, BR-PRF-06)", () => {
  it("rejects unauthenticated request with 401", async () => {
    const event = mockEvent();
    await expect(levelsAnalyticsHandler(event)).rejects.toSatisfy(
      (err: any) => err.statusCode === 401
    );
  });

  it("returns level stats with KPI flags for authenticated manager and enforces limit <= 100 (BR-PRF-06)", async () => {
    const db = getOwnerDb();
    const email = `analytics-mgr-${Date.now()}@example.com`;

    const [mgr] = await db
      .insert(managers)
      .values({
        email,
        passwordHash: "scrypt$mockhash",
        displayName: "Analytics Manager",
        role: "super_admin",
      })
      .returning();

    // Insert sample rollup row
    const num4 = Math.floor(Math.random() * 8999) + 1000;
    const glCode = `GL-C1-CNT-ANLY-${num4}`;
    const testDate = `2099-08-${String(Math.floor(10 + Math.random() * 18))}`;
    await db.insert(levelDailyStats).values({
      levelCode: glCode,
      contentVersion: 1,
      dateIct: testDate,
      playsCount: 10,
      completionsCount: 2, // 20% completion -> low_accuracy flag true (<30%)
      abandonedCount: 5, // 50% abandon -> high_abandonment flag true (>40%)
      avgDurationSeconds: 45,
      avgHintsUsed: 1,
    });

    try {
      // Request with limit 200 (should be capped to 100 per BR-PRF-06)
      const event = mockEvent(
        {
          id: mgr.id,
          displayName: mgr.displayName,
          role: mgr.role,
          version: mgr.sessionVersion,
        },
        `/api/managers/analytics/levels?limit=200&from=${testDate}`
      );

      const res = await levelsAnalyticsHandler(event);
      expect(res.items).toBeDefined();
      expect(res.limit).toBe(100);

      const matchItem = res.items.find((i: any) => i.level_code === glCode);
      expect(matchItem).toBeDefined();
      expect(matchItem.kpi_alerts.high_abandonment).toBe(true);
      expect(matchItem.kpi_alerts.low_accuracy).toBe(true);
    } finally {
      await db
        .delete(levelDailyStats)
        .where(eq(levelDailyStats.levelCode, glCode));
      await db.delete(managers).where(eq(managers.id, mgr.id));
    }
  });
});
