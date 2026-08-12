import { createAdminManagerToken } from "@kidthink/auth";
import { getOwnerDb, levelDailyStats, managers } from "@kidthink/db";
import { describe, expect, it } from "vitest";
import levelsAnalyticsHandler from "../../../server/api/managers/analytics/levels.get.ts";
import { respondToManagerAuthError } from "../../../server/utils/admin-auth-runtime.ts";

function mockEvent(
  headers: Record<string, string> = {},
  _query: Record<string, unknown> = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method: "GET",
    node: { req: { headers } },
    context: {},
    responseHeaders,
  } as any;
}

describe("Task 7 — GET /api/managers/analytics/levels (BR-TLM-01, BR-PRF-06)", () => {
  it("rejects unauthenticated request with 401", async () => {
    const event = mockEvent();
    let err: any;
    try {
      await levelsAnalyticsHandler(event);
    } catch (e) {
      err = e;
    }
    const res = respondToManagerAuthError(event, err);
    expect(res.statusCode).toBe(401);
  });

  it("returns level stats with KPI flags for authenticated manager and enforces limit <= 100 (BR-PRF-06)", async () => {
    const db = getOwnerDb();
    const email = `analytics-mgr-${Date.now()}@example.com`;

    const [mgr] = await db
      .insert(managers)
      .values({
        email,
        displayName: "Analytics Manager",
        role: "admin",
      })
      .returning();

    // Insert sample rollup row
    const glCode = `GL-ANALYTICS-${Date.now()}`;
    await db.insert(levelDailyStats).values({
      levelCode: glCode,
      contentVersion: 1,
      dateIct: "2026-08-11",
      playsCount: 10,
      completionsCount: 2, // 20% completion -> low_accuracy flag true (<30%)
      abandonedCount: 5, // 50% abandon -> high_abandonment flag true (>40%)
      avgDurationSeconds: 45,
      avgHintsUsed: 1,
    });

    const token = await createAdminManagerToken({
      payload: {
        manager_id: mgr.id,
        email: mgr.email,
        role: mgr.role as "admin",
        session_id: "m_session_analytics",
      },
      secret: "test_secret_32_bytes_minimum_length_key!!",
    });

    // Request with limit 200 (should be capped to 100 per BR-PRF-06)
    const event = mockEvent(
      { authorization: `Bearer ${token}` },
      { limit: "200" }
    );

    const res = await levelsAnalyticsHandler(event);
    expect(res.items).toBeDefined();
    expect(res.limit).toBe(100);

    const matchItem = res.items.find((i: any) => i.level_code === glCode);
    expect(matchItem).toBeDefined();
    expect(matchItem.kpi_alerts.high_abandonment).toBe(true);
    expect(matchItem.kpi_alerts.low_accuracy).toBe(true);
  });
});
