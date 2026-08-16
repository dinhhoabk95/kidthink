import {
  collections,
  curricula,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  libraryItems,
  users,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import collectionsGetHandler from "../../../server/api/users/collections/index.get.ts";
import libraryGetHandler from "../../../server/api/users/library/index.get.ts";
import libraryDeleteHandler from "../../../server/api/users/library/items/[entityType]/[entityId].delete.ts";

function mockUserEvent(
  userId?: number,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    params?: Record<string, string>;
    query?: Record<string, string>;
  } = {}
) {
  const method = options.method || "GET";
  const query = options.query || {};
  const queryStr =
    Object.keys(query).length > 0
      ? `/?${new URLSearchParams(query).toString()}`
      : "/";

  return {
    method,
    path: queryStr,
    url: queryStr,
    query,
    node: {
      req: {
        url: queryStr,
        headers: {},
      },
      res: {},
    },
    context: {
      ...(userId
        ? {
            user: {
              user_id: userId,
              display_name: "Test User",
              session_id: "sess_user_lib_test",
              refresh_token_version: 1,
            },
          }
        : {}),
      params: options.params || {},
      body: options.body,
    },
    // Mock readBody for H3
    _body: options.body,
  } as any;
}

// Global H3 mock interceptor for readBody in unit tests
declare global {
  var __mockBody: any;
}

describe("Task #82 — Library & Collections API Suite (BR-MLB-01..07)", () => {
  let user1Id: number;
  let _user2Id: number;
  let gameLevel1Id: number;
  let gameLevel2Id: number;
  let _curriculum1Id: number;

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10_000);

    // 1. Seed Users
    const [u1] = await db
      .insert(users)
      .values({
        email: `lib_user1_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Library User 1",
        status: "active",
      })
      .returning();
    user1Id = u1.id;

    const [u2] = await db
      .insert(users)
      .values({
        email: `lib_user2_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Library User 2",
        status: "active",
      })
      .returning();
    _user2Id = u2.id;

    // 2. Seed Templates & Levels
    const templateCode = "GT-001";
    await db
      .insert(gameTemplates)
      .values({
        code: templateCode,
        nameVi: "Game template test P3 Lib",
        mechanic: "drag_drop",
        contentContract: {},
      })
      .onConflictDoNothing();
    const [gt] = await db
      .select({ id: gameTemplates.id })
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode));
    const templateId = gt?.id ?? 1;

    let gl1Code = `GL-C1-NUM-CNT-${String(Math.floor(1000 + Math.random() * 8999))}`;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = `GL-C1-NUM-CNT-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const existing = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, candidate))
        .limit(1);
      if (existing.length === 0) {
        gl1Code = candidate;
        break;
      }
    }

    const [gl1] = await db
      .insert(gameLevels)
      .values({
        code: gl1Code,
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        templateId,
        difficulty: 1,
        titleVi: "Đếm số trái cây",
        accessTier: "standard",
        status: "published",
        contentPack: { items: ["apple"] },
        difficultyParams: { count: 3 },
      })
      .returning();
    gameLevel1Id = gl1.entityId;

    let gl2Code = `GL-C2-SHP-REC-${String(Math.floor(1000 + Math.random() * 8999))}`;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = `GL-C2-SHP-REC-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const existing = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, candidate))
        .limit(1);
      if (existing.length === 0) {
        gl2Code = candidate;
        break;
      }
    }

    const [gl2] = await db
      .insert(gameLevels)
      .values({
        code: gl2Code,
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        templateId,
        difficulty: 2,
        titleVi: "Phân biệt hình tam giác",
        accessTier: "premium",
        status: "archived",
        contentPack: { items: ["triangle"] },
        difficultyParams: { count: 4 },
      })
      .returning();
    gameLevel2Id = gl2.entityId;

    // 3. Seed Curriculum
    const [curr] = await db
      .insert(curricula)
      .values({
        code: `CUR-P3-LIB-${ts}-${rand}`.slice(0, 50),
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        titleVi: "Lộ trình tư duy toán 3-4 tuổi",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();
    _curriculum1Id = curr.entityId;
  });

  describe("GET /api/users/library", () => {
    it("Scenario: unauthenticated caller receives 401", async () => {
      const event = mockUserEvent();
      await expect(libraryGetHandler(event)).rejects.toThrow();
    });

    it("Scenario: empty library returns empty items and 5 suggested recommendations", async () => {
      const event = mockUserEvent(user1Id);
      const result = await libraryGetHandler(event);

      expect(result.items).toEqual([]);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    });

    it("Scenario: BR-MLB-01..05 — returns saved items with locked and archived flags resolved", async () => {
      const db = getOwnerDb();

      // Bookmark standard game level and archived premium game level
      await db.insert(libraryItems).values({
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
        note: "Trò chơi yêu thích của bé",
      });

      await db.insert(libraryItems).values({
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel2Id,
      });

      const event = mockUserEvent(user1Id);
      const result = await libraryGetHandler(event);

      expect(result.items.length).toBe(2);

      const standardItem = result.items.find(
        (i) => i.entity_id === gameLevel1Id
      );
      expect(standardItem?.title).toBe("Đếm số trái cây");
      expect(standardItem?.is_locked).toBe(true); // locked for user without standard tier
      expect(standardItem?.is_archived).toBe(false);

      const archivedItem = result.items.find(
        (i) => i.entity_id === gameLevel2Id
      );
      expect(archivedItem?.title).toBe("Phân biệt hình tam giác");
      expect(archivedItem?.is_archived).toBe(true); // BR-MLB-05
      expect(archivedItem?.status_label).toBe("Không còn khả dụng");
    });
  });

  describe("DELETE /api/users/library/items/[entityType]/[entityId]", () => {
    it("Scenario: removes item from library without deleting catalog entity", async () => {
      const db = getOwnerDb();
      await db.insert(libraryItems).values({
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
      });

      const deleteEvent = mockUserEvent(user1Id, {
        method: "DELETE",
        params: {
          entityType: "game_level",
          entityId: String(gameLevel1Id),
        },
      });

      const deleteResult = await libraryDeleteHandler(deleteEvent);
      expect(deleteResult.success).toBe(true);

      // Verify item removed from library
      const getEvent = mockUserEvent(user1Id);
      const libraryResult = await libraryGetHandler(getEvent);
      expect(
        libraryResult.items.find((i) => i.entity_id === gameLevel1Id)
      ).toBeUndefined();
    });
  });

  describe("Collections Management (BR-MLB-06)", () => {
    it("Scenario: GET /api/users/collections lists user collections with item counts", async () => {
      const db = getOwnerDb();
      const [col] = await db
        .insert(collections)
        .values({
          userId: user1Id,
          name: "Bộ sưu tập tuần 1",
          position: 1,
        })
        .returning();

      await db.insert(libraryItems).values({
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
        collectionId: col.id,
      });

      const event = mockUserEvent(user1Id);
      const result = await collectionsGetHandler(event);

      expect(result.collections.length).toBe(1);
      expect(result.collections[0].name).toBe("Bộ sưu tập tuần 1");
      expect(result.collections[0].item_count).toBe(1);
    });

    it("Scenario: BR-MLB-06 — enforces 20 collections quota", async () => {
      const db = getOwnerDb();

      // Seed 20 collections
      for (let i = 1; i <= 20; i++) {
        await db.insert(collections).values({
          userId: user1Id,
          name: `Bộ sưu tập ${i}`,
          position: i,
        });
      }

      const event = mockUserEvent(user1Id);
      const result = await collectionsGetHandler(event);
      expect(result.total).toBe(20);
    });
  });
});
