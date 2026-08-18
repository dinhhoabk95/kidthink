import {
  childProfiles,
  contentSkillMap,
  entitlements,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  masteryState,
  playSessions,
  seed,
  skills,
  users,
} from "@mindkid/db";
import { beforeAll, describe, expect, it } from "vitest";
import getAdvancedReportHandler from "../../server/api/users/children/[uuid]/reports/advanced.get";
import { invalidateUserEntitlementsCache } from "../../server/utils/entitlements-runtime.js";

function mockEvent(
  method: string,
  userId = 601,
  params: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  const responseHeaders: Record<string, string> = {};
  const queryString = new URLSearchParams(query).toString();
  const urlPath = `/api/users/children/${params.uuid ?? ""}/reports/advanced${queryString ? `?${queryString}` : ""}`;
  return {
    method,
    node: {
      req: {
        headers: {},
        url: urlPath,
        originalUrl: urlPath,
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      params,
      query,
      user: {
        user_id: userId,
        display_name: "Parent User",
        session_id: `sess_${userId}`,
      },
    },
  } as any;
}

describe("P3.7 Advanced Child Report API (BR-ARP-01..08, D-MY..D-NE)", () => {
  beforeAll(async () => {
    await seed();
  }, 60_000);

  it("Scenario: BR-ARP-02 & D-NB — returns 403 ENTITLEMENT_REQUIRED without child data when lacking entitlement", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({
        email: `adv_no_ent_${ts}@test.com`,
        displayName: "User No Ent",
      })
      .returning();

    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Test",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent("GET", user.id, { uuid: child.uuid });

    try {
      await getAdvancedReportHandler(event);
      expect.fail("Should throw 403 ENTITLEMENT_REQUIRED");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(403);
      expect(err.data?.code || err.statusMessage).toBe("ENTITLEMENT_REQUIRED");
      expect(err.data?.upgrade_package_codes).toEqual(["standard", "premium"]);
      // Verify NO child statistics leaked
      expect(err.data?.sections).toBeUndefined();
      expect(err.data?.mastery).toBeUndefined();
    }
  });

  it("returns 404 CHILD_NOT_FOUND when requesting child of another user", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [owner] = await db
      .insert(users)
      .values({ email: `adv_owner_${ts}@test.com`, displayName: "Owner User" })
      .returning();

    const [caller] = await db
      .insert(users)
      .values({
        email: `adv_caller_${ts}@test.com`,
        displayName: "Caller User",
      })
      .returning();

    // Grant caller entitlement
    await db.insert(entitlements).values({
      userId: caller.id,
      entitlementKey: "view_advanced_report",
      status: "active",
      source: "package_order",
    });
    await invalidateUserEntitlementsCache(caller.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: owner.id,
        displayName: "Bé Owner",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent("GET", caller.id, { uuid: child.uuid });

    try {
      await getAdvancedReportHandler(event);
      expect.fail("Should throw 404 CHILD_NOT_FOUND");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(404);
      expect(err.data?.code || err.statusMessage).toBe("CHILD_NOT_FOUND");
    }
  });

  it("returns 422 INVALID_PERIOD when passing unsupported period (e.g. 7d)", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({
        email: `adv_p_invalid_${ts}@test.com`,
        displayName: "User Period",
      })
      .returning();

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "view_advanced_report",
      status: "active",
      source: "package_order",
    });
    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Period",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent(
      "GET",
      user.id,
      { uuid: child.uuid },
      { period: "7d" }
    );

    try {
      await getAdvancedReportHandler(event);
      expect.fail("Should throw 422 INVALID_PERIOD");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(422);
      expect(err.data?.code || err.statusMessage).toBe("INVALID_PERIOD");
    }
  });

  it("Scenario: BR-ARP-01..08 — returns all 7 sections under threshold with insufficient_data without hiding sections", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({ email: `adv_ent_${ts}@test.com`, displayName: "User Entitled" })
      .returning();

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "view_advanced_report",
      status: "active",
      source: "package_order",
    });
    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé An",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    const event = mockEvent(
      "GET",
      user.id,
      { uuid: child.uuid },
      { period: "30d" }
    );
    const res = await getAdvancedReportHandler(event);

    expect(res.child.display_name).toBe("Bé An");
    expect(res.period).toBe("30d");

    // Check 7 sections exist and are not hidden (BR-ARP-02)
    expect(res.sections.competencies).toHaveLength(6);
    for (const comp of res.sections.competencies) {
      expect(comp.status).toBe("insufficient_data");
      expect(comp.sessions_needed).toBe(5);
      expect(comp.alt_text.length).toBeGreaterThan(0); // BR-ARP-03
    }

    expect(res.sections.weekly_trend.status).toBe("insufficient_data");
    expect(res.sections.weekly_trend.alt_text.length).toBeGreaterThan(0);

    expect(res.sections.independence_level.status).toBe("insufficient_data");
    expect(res.sections.independence_level.sessions_needed).toBe(10);
    expect(res.sections.independence_level.alt_text.length).toBeGreaterThan(0);

    expect(Array.isArray(res.sections.strands)).toBe(true);
    expect(Array.isArray(res.sections.skills)).toBe(true);
    expect(Array.isArray(res.sections.needs_reinforcement)).toBe(true);
    expect(Array.isArray(res.sections.ready_for_next)).toBe(true);
  });

  it("Scenario: BR-ARP-06 & BR-ARP-08 — surfaces reinforcement action guidance and version markers when sessions exist", async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    const [user] = await db
      .insert(users)
      .values({ email: `adv_full_${ts}@test.com`, displayName: "User Full" })
      .returning();

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "view_advanced_report",
      status: "active",
      source: "package_order",
    });
    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Đạt",
        birthYear: 2021,
        avatarId: "bunny_1",
      })
      .returning();

    let [template] = await db.select().from(gameTemplates).limit(1);
    if (!template) {
      [template] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          name: "Template Test",
          mechanic: "tap",
        })
        .returning();
    }

    const [level] = await db
      .insert(gameLevels)
      .values({
        code: `GL-C1-CNT-NUM-${String(ts % 10_000).padStart(4, "0")}`,
        entityId: 90_001,
        contentVersion: 1,
        templateId: template.id,
        title: "Bài tập đếm",
        contentPack: {},
        difficultyParams: {},
        accessTier: "free",
        status: "published",
      })
      .returning();

    const [targetSkill] = await db.select().from(skills).limit(1);

    await db
      .insert(contentSkillMap)
      .values({
        entityType: "level",
        entityId: level.id,
        skillId: targetSkill.id,
        weight: "1.00",
      })
      .onConflictDoNothing();

    // Set mastery state for this skill to need reinforcement (< 0.4 with >= 3 attempts)
    await db
      .insert(masteryState)
      .values({
        childProfileId: child.id,
        skillId: targetSkill.id,
        pLearn: "0.2500",
        emaCorrect: "0.3000",
        attemptsTotal: 4,
        hintRate: "0.4000",
      })
      .onConflictDoUpdate({
        target: [masteryState.childProfileId, masteryState.skillId],
        set: { pLearn: "0.2500", attemptsTotal: 4 },
      });

    // Insert 3 play sessions
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      await db.insert(playSessions).values({
        childProfileId: child.id,
        gameLevelId: level.id,
        contentVersion: i === 2 ? 2 : 1, // version 1 and version 2 for BR-ARP-08
        templateId: template.id,
        completionStatus: "completed",
        durationSeconds: 60,
        startedAt: new Date(now.getTime() - (i + 1) * 86_400_000),
      });
    }

    const event = mockEvent(
      "GET",
      user.id,
      { uuid: child.uuid },
      { period: "30d" }
    );
    const res = await getAdvancedReportHandler(event);

    // Verify reinforcement item with action (BR-ARP-06)
    expect(res.sections.needs_reinforcement.length).toBeGreaterThanOrEqual(1);
    const item = res.sections.needs_reinforcement.find(
      (r: any) => r.skill_code === targetSkill.code
    );
    expect(item).toBeDefined();
    expect(item?.actions.length).toBeGreaterThanOrEqual(1);
    expect(item?.actions[0].text).toBeDefined();

    // Verify version change marker (BR-ARP-08)
    expect(res.version_markers.length).toBeGreaterThanOrEqual(1);
    const marker = res.version_markers.find(
      (m: any) => m.level_code === level.code
    );
    expect(marker).toBeDefined();
    expect(marker?.played_versions).toEqual([1, 2]);
  });
});
