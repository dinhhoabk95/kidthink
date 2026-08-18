import { readFileSync } from "node:fs";
import { getOwnerDb, levelDailyStats } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/dashboard.get.js";

function mockEvent(managerRole?: "super_admin" | "content_reviewer") {
  return {
    method: "GET",
    path: "/api/managers/dashboard",
    node: {
      req: {
        headers: {},
        url: "/api/managers/dashboard",
      },
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Manager Test",
              session_id: "sess_mgr_123",
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 4 — GET /api/managers/dashboard (BR-DSH-01..06, D-IY, D-IZ, D-IX)", () => {
  it("Scenario: unauthenticated caller rejected with 401", async () => {
    const unauthEvent = mockEvent();
    await expect(handler(unauthEvent)).rejects.toThrow();
  });

  it("Scenario: D-IY & BR-DSH-06 — content_reviewer response strictly contains ONLY as_of and content", async () => {
    const reviewerEvent = mockEvent("content_reviewer");
    const res = (await handler(reviewerEvent)) as any;

    expect(res).toBeDefined();
    expect(res.as_of).toBeDefined();
    expect(res.content).toBeDefined();

    // Must NOT contain growth, system, todo, or any revenue/user keys
    expect(res).not.toHaveProperty("growth");
    expect(res).not.toHaveProperty("system");
    expect(res).not.toHaveProperty("todo");
    expect(res).not.toHaveProperty("revenue");
    expect(res).not.toHaveProperty("users");

    // Keys of top-level response must strictly be ["as_of", "content"]
    const topLevelKeys = Object.keys(res).sort();
    expect(topLevelKeys).toEqual(["as_of", "content"]);
  });

  it("Scenario: super_admin response contains all 4 groups (todo, growth, content, system) and as_of", async () => {
    const adminEvent = mockEvent("super_admin");
    const res = (await handler(adminEvent)) as any;

    expect(res).toBeDefined();
    expect(res.as_of).toBeDefined();
    expect(res.todo).toBeDefined();
    expect(res.growth).toBeDefined();
    expect(res.content).toBeDefined();
    expect(res.system).toBeDefined();
  });

  it("Scenario: D-IZ & BR-DSH-03 gate — endpoint source code does not query telemetry_events, play_events, or play_sessions", () => {
    const sourceCode = readFileSync(
      new URL("../../../server/api/managers/dashboard.get.ts", import.meta.url),
      "utf8"
    );

    expect(sourceCode).not.toContain("telemetry_events");
    expect(sourceCode).not.toContain("play_events");
    expect(sourceCode).not.toContain("play_sessions");
  });

  it("Scenario: BR-DSH-04 — as_of timestamp reflects pre-aggregated rollup timestamp", async () => {
    const db = getOwnerDb();
    const testRollupDate = new Date("2026-08-14T02:00:00.000Z");

    await db
      .insert(levelDailyStats)
      .values({
        levelCode: "GL-C1-CNT-TEST-0001",
        contentVersion: 1,
        dateIct: "2026-08-14",
        playsCount: 5,
        completionsCount: 3,
        abandonedCount: 1,
        avgDurationSeconds: 300,
        avgHintsUsed: 0,
        updatedAt: testRollupDate,
      })
      .onConflictDoUpdate({
        target: [
          levelDailyStats.levelCode,
          levelDailyStats.contentVersion,
          levelDailyStats.dateIct,
        ],
        set: { updatedAt: testRollupDate },
      });

    const event = mockEvent("super_admin");
    const res = (await handler(event)) as any;

    expect(res.as_of).toBeDefined();
    expect(new Date(res.as_of).getTime()).toBeGreaterThanOrEqual(
      testRollupDate.getTime()
    );
  }, 30_000);

  it("Scenario: BR-DSH-05 — response preserves child privacy and contains NO child names, UUIDs, or individual mastery", async () => {
    const event = mockEvent("super_admin");
    const res = (await handler(event)) as any;

    const resJson = JSON.stringify(res);
    expect(resJson).not.toContain("child_uuid");
    expect(resJson).not.toContain("child_name");
    expect(resJson).not.toContain("mastery_state");
    expect(resJson).not.toContain("play_history");
  });

  it("Scenario: D-IX — pending_source metrics return explicit status and owner_step, NEVER 0", async () => {
    const event = mockEvent("super_admin");
    const res = (await handler(event)) as any;

    expect(res.todo.pending_payments).toEqual({
      count: expect.any(Number),
    });
    expect(res.todo.pending_content).toEqual({
      count: expect.any(Number),
    });
    expect(res.growth.monthly_revenue).toEqual({
      current_vnd: expect.any(Number),
    });
    expect(res.content.curriculum_weeks_incomplete).toEqual({
      status: "pending_source",
      owner_step: "P3.3",
      is_feedback: true,
    });
    expect(res.content.published_lessons).toEqual({
      count: expect.any(Number),
    });
    expect(res.system.llm_cost_month).toEqual({
      status: "pending_source",
      owner_step: "P4",
    });
  });

  it("Scenario: §9 performance — 50 sequential calls achieve P95 < 500 ms", async () => {
    const event = mockEvent("super_admin");
    const latencies: number[] = [];

    // Warm-up call
    await handler(event);

    for (let i = 0; i < 50; i++) {
      const start = performance.now();
      await handler(event);
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index];

    expect(p95Latency).toBeLessThan(500);
  }, 30_000);
});
