import {
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
import dashboardHandler from "../../server/api/users/dashboard.get.ts";

function mockUserEvent(userId: number, query: Record<string, string> = {}) {
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
      user: {
        user_id: userId,
        display_name: "Multi-child Parent",
        session_id: "sess_user_multichild",
      },
    },
  } as any;
}

describe("Task #82 E2E Simulation — Multi-Child Switch Race & Isolation (BR-MDB-06, BR-CUR)", () => {
  let userId: number;
  let childAId: number;
  let childBId: number;

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10_000);

    // 1. Seed Parent User
    const [u] = await db
      .insert(users)
      .values({
        email: `race_user_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Race Test Parent",
        status: "active",
      })
      .returning();
    userId = u.id;

    // 2. Seed 2 Children
    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId,
        displayName: "Bé An (4 tuổi)",
        birthYear: 2021,
        avatarId: "bear",
      })
      .returning();
    childAId = cA.id;

    const [cB] = await db
      .insert(childProfiles)
      .values({
        userId,
        displayName: "Bé Bình (5 tuổi)",
        birthYear: 2020,
        avatarId: "rabbit",
      })
      .returning();
    childBId = cB.id;

    // 3. Seed template & level
    const templateCode = "GT-001";
    await db
      .insert(gameTemplates)
      .values({
        code: templateCode,
        name: "Game template test Race",
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
        title: "Đếm số trái cây",
        accessTier: "standard",
        status: "published",
        contentPack: { items: ["apple"] },
        difficultyParams: { count: 3 },
      })
      .returning();

    // 4. Enroll Child A in Curriculum
    const [currA] = await db
      .insert(curricula)
      .values({
        code: `CUR-RACE-A-${ts}-${rand}`.slice(0, 50),
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        title: "Lộ trình tư duy mầm non 4-5 tuổi",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();

    await db.insert(curriculumWeeks).values({
      curriculumId: currA.id,
      weekNo: 1,
      goal: "Tuần 1: Nhận biết số",
    });

    const [cItemA] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: currA.id,
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
        curriculumId: currA.id,
        status: "active",
      })
      .returning();

    await db.insert(curriculumItemProgress).values({
      enrollmentId: enrA.id,
      childId: childAId,
      curriculumItemId: cItemA.id,
      status: "completed",
      completedAt: new Date(),
    });
  });

  it("Scenario: rapid concurrent child switches maintain exact projection state without cross-contamination", async () => {
    // Fire concurrent asynchronous requests alternating between Child A and Child B
    const reqPromises = [
      dashboardHandler(mockUserEvent(userId, { child_id: String(childAId) })),
      dashboardHandler(mockUserEvent(userId, { child_id: String(childBId) })),
      dashboardHandler(mockUserEvent(userId, { child_id: String(childAId) })),
      dashboardHandler(mockUserEvent(userId, { child_id: String(childBId) })),
      dashboardHandler(mockUserEvent(userId, { child_id: String(childAId) })),
    ];

    const results = await Promise.all(reqPromises);

    // Verify Child A results
    expect(results[0].active_child_id).toBe(childAId);
    expect(results[0].curriculum?.enrolled).toBe(true);
    expect(results[0].curriculum?.title).toBe(
      "Lộ trình tư duy mầm non 4-5 tuổi"
    );

    expect(results[2].active_child_id).toBe(childAId);
    expect(results[2].curriculum?.enrolled).toBe(true);

    expect(results[4].active_child_id).toBe(childAId);
    expect(results[4].curriculum?.enrolled).toBe(true);

    // Verify Child B results (never receives Child A's enrollment)
    expect(results[1].active_child_id).toBe(childBId);
    expect(results[1].curriculum?.enrolled).toBe(false);

    expect(results[3].active_child_id).toBe(childBId);
    expect(results[3].curriculum?.enrolled).toBe(false);
  });
});
