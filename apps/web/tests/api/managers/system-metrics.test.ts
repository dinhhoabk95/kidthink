import { describe, expect, it } from "vitest";
import handler from "#server/api/managers/system/metrics.get";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  url = "/api/managers/system/metrics"
) {
  return {
    method: "GET",
    node: {
      req: {
        headers: {},
        url,
      },
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Manager Name",
              session_id: "sess_manager_123",
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 4 — GET /api/managers/system/metrics (BR-MON-01, Spec §7.1)", () => {
  it("rejects unauthenticated request with 401", async () => {
    const event = mockEvent();
    await expect(handler(event)).rejects.toThrow();
  });

  it("rejects content_reviewer with 403 INSUFFICIENT_ROLE", async () => {
    const event = mockEvent("content_reviewer");
    try {
      await handler(event);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("permits super_admin and returns 4 SLO snapshot with pending_source for unready metrics", async () => {
    const event = mockEvent("super_admin");
    const res = await handler(event);

    expect(res).toBeDefined();
    expect(res.as_of).toBeDefined();
    expect(res.slos).toBeDefined();

    // 4 SLOs per spec §7.1
    expect(res.slos.uptime.target).toBe(0.997);
    expect(res.slos.uptime.status).toBe("healthy");

    expect(res.slos.api_p95.target).toBe(800);
    expect(res.slos.api_p95.status).toBe("healthy");

    expect(res.slos.game_fps.target).toBe(60);
    expect(res.slos.game_fps.status).toBe("healthy");

    // Payment request SLO has pending_source: P2.3 and current: null (no fabricated numbers)
    expect(res.slos.payment_p90.status).toBe("pending_source");
    expect(res.slos.payment_p90.current).toBeNull();
    expect(res.slos.payment_p90.pending_step).toBe("P2.3");

    expect(Array.isArray(res.open_alerts)).toBe(true);
  });
});
