import { describe, expect, it } from "vitest";
import handler from "../../server/api/managers/emoji/index.get.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  query: Record<string, string> = {}
) {
  const qStr = new URLSearchParams(query).toString();
  return {
    method: "GET",
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
        url: `/api/managers/emoji${qStr ? `?${qStr}` : ""}`,
      },
      res: {
        setHeader: (_name: string, _value: string) => {
          // mock response header
        },
      },
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Manager Name",
              session_id: "sess_manager_123",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
    },
    query,
  } as any;
}

describe("GET /api/managers/emoji (BR-EPK-01 - BR-EPK-08, Spec §7.1)", () => {
  it("rejects unauthenticated request with error", async () => {
    const event = mockEvent();
    await expect(handler(event)).rejects.toThrow();
  });

  it("returns educational emojis with categories for authenticated manager", async () => {
    const event = mockEvent("content_reviewer", { limit: "20" });

    const res = (await handler(event)) as any;
    expect(res.items).toBeDefined();
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.categories).toBeDefined();
    expect(res.categories.length).toBeGreaterThanOrEqual(30);
  });

  it("searches with Vietnamese diacritics tolerance (BR-EPK-02)", async () => {
    const event1 = mockEvent("content_reviewer", { q: "táo" });
    const res1 = (await handler(event1)) as any;

    const event2 = mockEvent("content_reviewer", { q: "tao" });
    const res2 = (await handler(event2)) as any;

    expect(res1.items.length).toBeGreaterThan(0);
    expect(res2.items.length).toBeGreaterThan(0);
    expect(
      res1.items.some(
        (e: any) => e.emoji === "🍎" || e.name.toLowerCase().includes("táo")
      )
    ).toBe(true);
    expect(
      res2.items.some(
        (e: any) => e.emoji === "🍎" || e.name.toLowerCase().includes("táo")
      )
    ).toBe(true);
  });

  it("filters by category properly", async () => {
    const event = mockEvent("content_reviewer", {
      category: "fruit",
      limit: "10",
    });
    const res = (await handler(event)) as any;
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items.every((e: any) => e.category === "fruit")).toBe(true);
  });
});
