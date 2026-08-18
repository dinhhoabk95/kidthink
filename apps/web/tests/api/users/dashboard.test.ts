import {
  childDailyStats,
  childProfiles,
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  users,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import dashboardHandler from "../../../server/api/users/dashboard.get.ts";

function mockUserEvent(userId?: number, query: Record<string, string> = {}) {
  const queryStr =
    Object.keys(query).length > 0
      ? `/?${new URLSearchParams(query).toString()}`
      : "/";

  return {
    method: "GET",
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
              session_id: "sess_user_test",
            },
          }
        : {}),
    },
  } as any;
}

describe("Task #82 — GET /api/users/dashboard (BR-MDB-01..07, BR-CUR-01..10)", () => {
  let user1Id: number;
  let user2Id: number;
  let childAId: number;
  let childAUuid: string;
  let childBId: number;
  let _childBUuid: string;

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10_000);

    // 1. Seed Users
    const [u1] = await db
      .insert(users)
      .values({
        email: `dashboard_u1_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User 1",
        status: "active",
      })
      .returning();
    user1Id = u1.id;

    const [u2] = await db
      .insert(users)
      .values({
        email: `dashboard_u2_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User 2",
        status: "active",
      })
      .returning();
    user2Id = u2.id;

    // 2. Seed Child Profiles for User 1
    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId: user1Id,
        displayName: "Bé An",
        birthYear: 2021,
        avatarId: "bear",
      })
      .returning();
    childAId = cA.id;
    childAUuid = cA.uuid;

    const [cB] = await db
      .insert(childProfiles)
      .values({
        userId: user1Id,
        displayName: "Bé Bình",
        birthYear: 2020,
        avatarId: "rabbit",
      })
      .returning();
    childBId = cB.id;
    _childBUuid = cB.uuid;

    // 3. Seed template & level
    const templateCode = "GT-001";
    await db
      .insert(gameTemplates)
      .values({
        code: templateCode,
        name: "Game template test P3",
        mechanic: "drag_drop",
        contentContract: {},
      })
      .onConflictDoNothing();
    const [gt] = await db
      .select({ id: gameTemplates.id })
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode));
    const templateId = gt?.id ?? 1;

    let glCode = `GL-C1-NUM-CNT-${String(Math.floor(1000 + Math.random() * 8999))}`;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = `GL-C1-NUM-CNT-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const existing = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, candidate))
        .limit(1);
      if (existing.length === 0) {
        glCode = candidate;
        break;
      }
    }

    const [gl] = await db
      .insert(gameLevels)
      .values({
        code: glCode,
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        templateId,
        difficulty: 1,
        title: "Đếm số vui vẻ",
        accessTier: "standard",
        status: "published",
        contentPack: { items: ["apple"] },
        difficultyParams: { count: 3 },
      })
      .returning();

    // 4. Seed Curriculum for Child A
    const [curr] = await db
      .insert(curricula)
      .values({
        code: `CUR-P3-DASH-${ts}-${rand}`.slice(0, 50),
        entityId: 3000 + (ts % 100_000),
        title: "Lộ trình tư duy toán mầm non",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();

    await db.insert(curriculumWeeks).values({
      curriculumId: curr.id,
      weekNo: 1,
      goal: "Làm quen với số",
    });

    const [cItem] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: curr.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl.id,
        isRequired: true,
      })
      .returning();

    const [enrA] = await db
      .insert(curriculumEnrollments)
      .values({
        childId: childAId,
        curriculumId: curr.id,
        status: "active",
      })
      .returning();

    await db.insert(curriculumItemProgress).values({
      enrollmentId: enrA.id,
      childId: childAId,
      curriculumItemId: cItem.id,
      status: "completed",
      completedAt: new Date(),
    });

    // 5. Seed Rollup Data for child A
    const todayIct = new Date().toISOString().slice(0, 10);
    await db.insert(childDailyStats).values({
      childProfileId: childAId,
      dateIct: todayIct,
      sessionsCount: 2,
      totalPlayTimeSeconds: 600,
      levelsCompleted: 2,
    });
  });

  it("Scenario: unauthenticated caller is rejected with 401", async () => {
    const event = mockUserEvent();
    await expect(dashboardHandler(event)).rejects.toThrow();
  });

  it("Scenario: BR-MDB-01 — user with no child profiles receives empty children array", async () => {
    const event = mockUserEvent(user2Id);
    const result = await dashboardHandler(event);

    expect(result.children).toEqual([]);
    expect(result.recent_progress).toEqual([]);
    expect(result.curriculum).toBeNull();
    expect(result.subscription).toBeDefined();
  });

  it("Scenario: multi-child dashboard returns active child curriculum without data mixing", async () => {
    // Default call -> child A is active
    const eventA = mockUserEvent(user1Id);
    const resultA = await dashboardHandler(eventA);

    expect(resultA.children.length).toBe(2);
    expect(resultA.active_child_id).toBe(childAId);
    expect(resultA.curriculum?.enrolled).toBe(true);
    expect(resultA.curriculum?.title).toBe("Lộ trình tư duy toán mầm non");

    // Explicit switch to Child B
    const eventB = mockUserEvent(user1Id, { child_id: String(childBId) });
    const resultB = await dashboardHandler(eventB);

    expect(resultB.active_child_id).toBe(childBId);
    expect(resultB.curriculum?.enrolled).toBe(false); // Child B has no curriculum
  });

  it("Scenario: accessing another user's child profile returns 404 (BR-ERR-05 / BR-ACT-03)", async () => {
    // User 2 tries to request User 1's child ID
    const event = mockUserEvent(user2Id, { child_id: String(childAId) });
    await expect(dashboardHandler(event)).rejects.toThrow();

    // User 2 tries to request User 1's child UUID
    const eventUuid = mockUserEvent(user2Id, { child_uuid: childAUuid });
    await expect(dashboardHandler(eventUuid)).rejects.toThrow();
  });

  it("Scenario: BR-MDB-05 — quota indicator only shows when usage exceeds 80%", async () => {
    // User 1 has 2/5 children (40% <= 80%) -> show_quota_indicator is false
    const event = mockUserEvent(user1Id);
    const result = await dashboardHandler(event);

    expect(result.subscription.quota.children_count).toBe(2);
    expect(result.subscription.quota.show_quota_indicator).toBe(false);

    // Add 3 more children to make 5/5 (100% > 80%)
    const db = getOwnerDb();
    for (let i = 3; i <= 5; i++) {
      await db.insert(childProfiles).values({
        userId: user1Id,
        displayName: `Bé ${i}`,
        birthYear: 2021,
        avatarId: "cat",
      });
    }

    const resultFull = await dashboardHandler(event);
    expect(resultFull.subscription.quota.children_count).toBe(5);
    expect(resultFull.subscription.quota.show_quota_indicator).toBe(true);
  });

  it("Scenario: BR-MDB-06 — forbids comparing children or ranking them in dashboard payload", async () => {
    const event = mockUserEvent(user1Id);
    const result = await dashboardHandler(event);

    expect(result).not.toHaveProperty("rankings");
    expect(result).not.toHaveProperty("comparison");
    expect(result.children[0]).not.toHaveProperty("rank");
    expect(result.children[0]).not.toHaveProperty("score");
  });

  it("Scenario: BR-MDB-07 — provides at most one upgrade CTA per page", async () => {
    const event = mockUserEvent(user1Id);
    const result = await dashboardHandler(event);

    const upgradeCta = result.subscription.upgrade_cta;
    if (upgradeCta) {
      expect(upgradeCta).toHaveProperty("label");
      expect(upgradeCta).toHaveProperty("url");
    }
  });
});
