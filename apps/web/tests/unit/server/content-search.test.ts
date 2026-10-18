import { gameLevels, getOwnerDb } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  searchGameLevels,
  searchLessons,
} from "#server/services/content-search.js";

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

  it("Scenario: BR-SRC-02 — caps limit parameter at 60 for levels, 40 for lessons, and 100 for managers", async () => {
    const db = getOwnerDb();
    const levelResult = await searchGameLevels(
      db,
      { limit: 5000 },
      { role: "user", userPackage: "free" }
    );
    expect(levelResult.items.length).toBeLessThanOrEqual(60);

    const lessonResult = await searchLessons(
      db,
      { limit: 5000 },
      { role: "user", userPackage: "free" }
    );
    expect(lessonResult.items.length).toBeLessThanOrEqual(40);

    const managerResult = await searchGameLevels(
      db,
      { limit: 5000 },
      { role: "manager" }
    );
    expect(managerResult.items.length).toBeLessThanOrEqual(100);
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
      const page1Ids = new Set(page1.items.map((it) => it.id));
      for (const it of page2.items) {
        expect(page1Ids.has(it.id)).toBe(false);
      }
    }
  });

  it("Scenario: BR-SRC-05 — guest role only sees published items, ignoring status=draft param", async () => {
    const db = getOwnerDb();
    const result = await searchGameLevels(
      db,
      { status: "draft" },
      { role: "guest" }
    );

    for (const item of result.items) {
      expect(item.status).toBe("published");
    }
  });

  it("Scenario: BR-SRC-06 — sets no_store header flag when results contain locked/paid content or viewer is paid", async () => {
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

    const paidViewerResult = await searchGameLevels(
      db,
      { limit: 5, access_tier: "free" },
      { role: "user", userPackage: "PKG-premium" }
    );
    expect(paidViewerResult.no_store).toBe(true);
  });

  it("Scenario: BR-SRC-07 — supports accent-insensitive Vietnamese search", async () => {
    const db = getOwnerDb();
    const uniqueCode = `GL-C1-SRC-${Date.now()}`;
    const [inserted] = await db
      .insert(gameLevels)
      .values({
        entityId: Math.floor(Date.now() / 1000),
        code: uniqueCode,
        contentVersion: 1,
        templateCode: "GT-001",
        title: "Đếm quả táo đỏ trên cây",
        description: "Trò chơi đếm quả táo",
        contentPack: { prompt: "Đếm táo" },
        difficultyParams: { distractor_count: 1 },
        accessTier: "free",
        status: "published",
      })
      .returning({ id: gameLevels.id });

    try {
      const result = await searchGameLevels(
        db,
        { q: "dem qua tao do tren cay", limit: 20 },
        { role: "guest" }
      );

      expect(result.items.some((it) => it.code === uniqueCode)).toBe(true);
    } finally {
      if (inserted) {
        await db
          .update(gameLevels)
          .set({ status: "archived" })
          .where(eq(gameLevels.id, inserted.id));
      }
    }
  });
});
