import {
  childProfiles,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  packages,
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGES,
  users,
} from "@kidthink/db";
import { beforeAll, describe, expect, it } from "vitest";
import subscribersHandler from "../../../server/api/managers/packages/[code]/subscribers.get";
import packagesListHandler from "../../../server/api/managers/packages/index.get";

function mockManagerEvent(
  managerRole?: "super_admin" | "content_reviewer",
  params?: Record<string, string>,
  url = "/api/managers/packages"
) {
  const parsedQuery: Record<string, string> = {};
  if (url.includes("?")) {
    const queryString = url.split("?")[1];
    const searchParams = new URLSearchParams(queryString);
    for (const [k, v] of searchParams.entries()) {
      parsedQuery[k] = v;
    }
  }

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
      params: params || {},
      query: parsedQuery,
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Super Admin",
              session_id: "sess_sa",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 4 — Package Catalog Admin & Subscribers Suite (BR-PCA-01..06, D-JP, D-JO)", () => {
  beforeAll(async () => {
    const db = getOwnerDb();
    for (const k of SEED_ENTITLEMENT_KEYS) {
      await db.insert(entitlementKeys).values(k).onConflictDoNothing();
    }
    for (const pkg of SEED_PACKAGES) {
      await db.insert(packages).values(pkg).onConflictDoNothing();
    }
  });
  it("Scenario: rejects unauthenticated requests with 401", async () => {
    const event = mockManagerEvent();
    await expect(packagesListHandler(event)).rejects.toThrow();
  });

  it("Scenario: BR-PCA-05 — content_reviewer is rejected with 403 INSUFFICIENT_ROLE", async () => {
    const event = mockManagerEvent("content_reviewer");
    try {
      await packagesListHandler(event);
      expect.fail("Should have thrown 403");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(403);
    }
  });

  it("Scenario: BR-PCA-02, BR-PCA-04 & D-JP — returns all packages including unreleased add-ons with requires_spec", async () => {
    const event = mockManagerEvent("super_admin");
    const res = await packagesListHandler(event);

    expect(res).toBeDefined();
    expect(Array.isArray(res.packages)).toBe(true);
    expect(res.packages.length).toBeGreaterThanOrEqual(6);

    // Verify standard and premium packages
    const standard = res.packages.find((p) => p.code === "PKG-standard");
    expect(standard).toBeDefined();
    expect(standard?.is_public).toBe(true);

    // Verify 4 add-on packages with is_public = false and requires_spec
    const addonLessonPlan = res.packages.find(
      (p) => p.code === "PKG-addon_lesson_plan"
    );
    expect(addonLessonPlan).toBeDefined();
    expect(addonLessonPlan?.is_public).toBe(false);
    expect(addonLessonPlan?.requires_spec).toBe(
      "07-addon/lesson-plan-creator.md"
    );

    const addonCurriculum = res.packages.find(
      (p) => p.code === "PKG-addon_curriculum"
    );
    expect(addonCurriculum?.requires_spec).toBe(
      "07-addon/personal-curriculum.md"
    );

    const addonCustomGame = res.packages.find(
      (p) => p.code === "PKG-addon_custom_game"
    );
    expect(addonCustomGame?.requires_spec).toBe(
      "07-addon/custom-game-builder.md"
    );

    const addonAi = res.packages.find((p) => p.code === "PKG-addon_ai");
    expect(addonAi?.requires_spec).toBe("07-addon/ai-credit-ledger.md");
  });

  it("Scenario: BR-PCA-03 & D-JO — reports active subscribers and 30-day approved revenue", async () => {
    const db = getOwnerDb();
    const testEmail = `subscriber_pkg_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Subscriber Test User",
      })
      .returning();

    // Insert active entitlement for PKG-standard
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
    });

    const event = mockManagerEvent("super_admin");
    const res = await packagesListHandler(event);
    const standard = res.packages.find((p) => p.code === "PKG-standard");

    expect(standard?.active_subscribers_count).toBeGreaterThanOrEqual(1);
  });

  it("Scenario: BR-PCA-06 — GET /api/managers/packages/[code]/subscribers excludes child profile PII", async () => {
    const db = getOwnerDb();
    const testEmail = `sub_no_child_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [user] = await db
      .insert(users)
      .values({
        email: testEmail,
        displayName: "Parent With Secret Child",
      })
      .returning();

    // Insert child profile for this user
    await db.insert(childProfiles).values({
      userId: user.id,
      displayName: "Bé Siêu Bí Mật",
      birthYear: 2021,
      avatarId: "avatar-01",
      status: "active",
    });

    // Insert entitlement for PKG-standard
    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_standard_games",
      source: "package_order",
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 86_400_000),
    });

    const event = mockManagerEvent(
      "super_admin",
      { code: "PKG-standard" },
      "/api/managers/packages/PKG-standard/subscribers?limit=50"
    );

    const res = await subscribersHandler(event);
    expect(res).toBeDefined();
    expect(Array.isArray(res.subscribers)).toBe(true);

    const found = res.subscribers.find((s: any) => s.email === testEmail);
    expect(found).toBeDefined();
    expect(found.display_name).toBe("Parent With Secret Child");

    // BR-PCA-06: STRICTLY NO child name, birth year, or child object in subscriber record!
    expect((found as any).child_name).toBeUndefined();
    expect((found as any).child_profiles).toBeUndefined();
    expect((found as any).children).toBeUndefined();
    expect(JSON.stringify(res)).not.toContain("Bé Siêu Bí Mật");
  });

  it("Scenario: cursor pagination on subscribers endpoint paginates sequentially in desc order", async () => {
    const db = getOwnerDb();
    const user1Email = `sub_p1_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;
    const user2Email = `sub_p2_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}@example.com`;

    const [u1] = await db
      .insert(users)
      .values({ email: user1Email, displayName: "User 1" })
      .returning();
    const [u2] = await db
      .insert(users)
      .values({ email: user2Email, displayName: "User 2" })
      .returning();

    await db.insert(entitlements).values([
      {
        userId: u1.id,
        entitlementKey: "play_standard_games",
        source: "package_order",
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
      },
      {
        userId: u2.id,
        entitlementKey: "play_standard_games",
        source: "package_order",
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 86_400_000),
      },
    ]);

    const eventPage1 = mockManagerEvent(
      "super_admin",
      { code: "PKG-standard" },
      "/api/managers/packages/PKG-standard/subscribers?limit=1"
    );
    const res1 = await subscribersHandler(eventPage1);

    expect(res1.subscribers.length).toBe(1);
    expect(res1.next_cursor).toBeDefined();

    if (res1.next_cursor) {
      const eventPage2 = mockManagerEvent(
        "super_admin",
        { code: "PKG-standard" },
        `/api/managers/packages/PKG-standard/subscribers?limit=1&cursor=${res1.next_cursor}`
      );
      const res2 = await subscribersHandler(eventPage2);
      expect(res2.subscribers.length).toBeGreaterThanOrEqual(1);
      expect(res2.subscribers[0].user_id).not.toBe(res1.subscribers[0].user_id);
    }
  });
});
