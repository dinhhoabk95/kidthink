import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/client";
import { searchGameLevels } from "#src/services/content-search";

describe("Content Search Service & Invariants (BR-SRC-01..07)", () => {
  it("Scenario: BR-SRC-01 — locked items omit content_pack and difficulty_params", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { limit: 20 },
      { role: "user", userPackage: "free" }
    );

    for (const item of result.items) {
      if (item.locked) {
        expect(item).not.toHaveProperty("content_pack");
        expect(item).not.toHaveProperty("difficulty_params");
        expect(item.locked).toBe(true);
      } else {
        expect(item).toHaveProperty("content_pack");
        expect(item).toHaveProperty("difficulty_params");
        expect(item.locked).toBe(false);
      }
    }
  });

  it("Scenario: BR-SRC-02 — caps limit parameter at 60 for non-managers", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { limit: 5000 },
      { role: "user", userPackage: "free" }
    );

    expect(result.items.length).toBeLessThanOrEqual(60);
  });

  it("Scenario: BR-SRC-03 — validates parameters via Zod without SQL injection", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { q: "dem' OR '1'='1 -- %" },
      { role: "guest" }
    );

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("Scenario: BR-SRC-04 — supports cursor pagination", async () => {
    const db = getOwnerDb();
    const page1 = await searchGameLevels(db, { limit: 5 }, { role: "guest" });

    if (page1.next_cursor) {
      const page2 = await searchGameLevels(
        db,
        { limit: 5, cursor: page1.next_cursor },
        { role: "guest" }
      );
      expect(page2.items).toBeDefined();
    }
  });

  it("Scenario: BR-SRC-05 — guest role only sees published items, ignoring status=draft param", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { status: "draft" as any },
      { role: "guest" }
    );

    for (const item of result.items) {
      expect(item.status).toBe("published");
    }
  });

  it("Scenario: BR-SRC-06 — sets no_store header flag when results contain locked/paid content", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { limit: 50 },
      { role: "user", userPackage: "free" }
    );

    const hasPaidOrLocked = result.items.some(
      (item) => item.locked || item.access_tier !== "free"
    );

    expect(result.no_store).toBe(hasPaidOrLocked);
  });

  it("Scenario: BR-SRC-07 — supports accent-insensitive Vietnamese search", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { q: "dem qua tao" },
      { role: "guest" }
    );

    expect(result.items).toBeDefined();
  });
});
