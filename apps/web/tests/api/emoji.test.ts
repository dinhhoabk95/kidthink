import type { H3Event } from "h3";
import { describe, expect, it } from "vitest";
import handler from "#server/api/managers/emoji/index.get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  query: Record<string, string> = {}
): H3Event {
  const qStr = new URLSearchParams(query).toString();
  const url = `/api/managers/emoji${qStr ? `?${qStr}` : ""}`;
  const partial: Partial<H3Event> & { query: Record<string, string> } = {
    method: "GET",
    path: url,
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        url,
      } as H3Event["node"]["req"],
      res: {
        setHeader: (_name: string, _value: string) => {
          // mock response header
        },
      } as H3Event["node"]["res"],
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
    query,
  };
  return partial as H3Event;
}

describe("GET /api/managers/emoji (BR-EMJ-01 - BR-EMJ-12, Spec §7.1)", () => {
  it("rejects unauthenticated request with error", async () => {
    const event = mockEvent();
    await expect(handler(event)).rejects.toThrow();
  });

  it("returns educational emojis with categories for authenticated manager", async () => {
    const event = mockEvent("content_reviewer", { limit: "20" });

    const res = await handler(event);
    expect(res.items).toBeDefined();
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.categories).toBeDefined();
    expect(res.categories.length).toBeGreaterThanOrEqual(30);
  });

  it("searches with Vietnamese diacritics tolerance (BR-EMJ-05)", async () => {
    const event1 = mockEvent("content_reviewer", { q: "táo" });
    const res1 = await handler(event1);

    const event2 = mockEvent("content_reviewer", { q: "tao" });
    const res2 = await handler(event2);

    expect(res1.items.length).toBeGreaterThan(0);
    expect(res2.items.length).toBeGreaterThan(0);
    expect(
      res1.items.some(
        (e) => e.emoji === "🍎" || e.name.toLowerCase().includes("táo")
      )
    ).toBe(true);
    expect(
      res2.items.some(
        (e) => e.emoji === "🍎" || e.name.toLowerCase().includes("táo")
      )
    ).toBe(true);
  });

  it("filters by category properly", async () => {
    const event = mockEvent("content_reviewer", {
      category: "fruit",
      limit: "10",
    });
    const res = await handler(event);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((e) => e.categories.includes("fruit"))).toBe(true);
  });

  it("filters by age_band so items have age_min <= band minimum (BR-EMJ-08)", async () => {
    const event = mockEvent("content_reviewer", {
      category: "fruit",
      age_band: "3-4",
      limit: "50",
    });
    const res = await handler(event);
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((e) => e.age_min <= 3)).toBe(true);
  });
});
