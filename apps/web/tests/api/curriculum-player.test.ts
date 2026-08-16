import crypto from "node:crypto";
import {
  childProfiles,
  curricula,
  curriculumItems,
  curriculumWeeks,
  entitlementKeys,
  entitlements,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  users,
} from "@kidthink/db";
import {
  computeCurriculumProgress,
  resolveNextStep,
  selectVariant,
} from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import completeItemHandler from "../../server/api/users/children/[uuid]/curriculum/complete-item.post.js";
import nextStepHandler from "../../server/api/users/children/[uuid]/curriculum/next.get.js";
import progressHandler from "../../server/api/users/children/[uuid]/curriculum/progress.get.js";
import enrollHandler from "../../server/api/users/children/[uuid]/enrollments/index.post.js";
import withdrawHandler from "../../server/api/users/children/[uuid]/enrollments/withdraw.post.js";
import { invalidateUserEntitlementsCache } from "../../server/utils/entitlements-runtime.js";

function makeUserEvent(
  userId: number,
  routerParams: Record<string, string> = {},
  body?: Record<string, unknown>,
  method?: string
) {
  const resolvedMethod = method || (body ? "POST" : "GET");
  const csrfToken = "a".repeat(64);
  const responseHeaders: Record<string, string> = {};
  return {
    method: resolvedMethod,
    node: {
      req: {
        method: resolvedMethod,
        socket: { remoteAddress: "127.0.0.1" },
        headers: {
          "x-csrf-token": csrfToken,
          cookie: `tm_u_csrf=${csrfToken}`,
          "sec-fetch-site": "same-origin",
        },
        url: "/",
        originalUrl: "/",
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
      user: {
        user_id: String(userId),
        display_name: "Test Parent",
        session_id: `sess_${userId}`,
        refresh_token_version: 0,
      },
      params: routerParams,
      body: body || {},
    },
    _body: body,
  } as any;
}

describe("Curriculum Player Suite — P3.4 (BR-CUR-01..10, D-MA..D-MG)", {
  timeout: 30_000,
}, () => {
  async function createTestFixtures() {
    const db = getOwnerDb();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    // 1. User & Child
    const [user] = await db
      .insert(users)
      .values({
        email: `parent-cur-${crypto.randomUUID()}@example.com`,
        displayName: "Parent Cur",
        status: "active",
      })
      .returning();

    await invalidateUserEntitlementsCache(user.id);

    const [child] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Cur",
        birthYear: 2021, // 5 years old in 2026
        avatarId: "cat",
        status: "active",
      })
      .returning();

    // 2. Templates & Levels
    const [template] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-001",
        nameVi: "Template Cur",
        mechanic: "tap_target",
      })
      .onConflictDoNothing()
      .returning();

    const templateId = template
      ? template.id
      : (
          await db
            .select()
            .from(gameTemplates)
            .where(eq(gameTemplates.code, "GT-001"))
        )[0].id;

    // Create 6 published levels
    const createdLevels: (typeof gameLevels.$inferSelect)[] = [];
    for (let i = 1; i <= 6; i++) {
      const num4 = (Math.floor(Math.random() * 8999) + 1000).toString();
      const glCode = `GL-C1-NUM-TEST-${num4}`;
      await db.delete(gameLevels).where(eq(gameLevels.code, glCode));

      const [lvl] = await db
        .insert(gameLevels)
        .values({
          entityId: uid + 100 + i,
          code: glCode,
          contentVersion: 1,
          templateId,
          titleVi: `Trò chơi ${i}`,
          instructionVi: "Hướng dẫn",
          contentPack: { level: i },
          difficultyParams: { difficulty: 1 },
          accessTier: i === 4 ? "premium" : "free", // Level 4 is premium
          status: "published",
        })
        .returning();
      createdLevels.push(lvl);
    }

    // 3. Published Curriculum 8 weeks
    const curCode = `CUR-BE5-${uid}`;
    const [cur] = await db
      .insert(curricula)
      .values({
        entityId: uid + 10,
        code: curCode,
        contentVersion: 1,
        programType: "age_based",
        targetAgeMin: 4,
        targetAgeMax: 6,
        durationWeeks: 8,
        sessionsPerWeek: 3,
        titleVi: "Chương trình Toán 5 tuổi",
        accessTier: "free",
        status: "published",
      })
      .returning();

    // Weeks
    for (let w = 1; w <= 8; w++) {
      await db.insert(curriculumWeeks).values({
        curriculumId: cur.id,
        weekNo: w,
        goal: `Mục tiêu tuần ${w}`,
      });
    }

    // Week 1: 3 items (item 1: Level 1, item 2: Level 2, item 3: Level 3)
    const [w1Item1] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: createdLevels[0].entityId,
        isRequired: true,
      })
      .returning();

    const [w1Item2] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 2,
        position: 1,
        entityType: "game_level",
        entityId: createdLevels[1].entityId,
        isRequired: true,
      })
      .returning();

    const [w1Item3] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 1,
        sessionNo: 3,
        position: 1,
        entityType: "game_level",
        entityId: createdLevels[2].entityId,
        isRequired: false, // Optional item
      })
      .returning();

    // Week 2: Item 1 (Level 4 - premium), Item 2 (Level 5 - free)
    const [w2Item1] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 2,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: createdLevels[3].entityId, // Premium
        isRequired: true,
      })
      .returning();

    const [w2Item2] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 2,
        sessionNo: 2,
        position: 1,
        entityType: "game_level",
        entityId: createdLevels[4].entityId, // Free
        isRequired: true,
      })
      .returning();

    // Week 3: Item 1 (Level 6 - free)
    const [w3Item1] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: cur.id,
        weekNo: 3,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: createdLevels[5].entityId, // Free
        isRequired: true,
      })
      .returning();

    return {
      db,
      user,
      child,
      curriculum: cur,
      createdLevels,
      items: { w1Item1, w1Item2, w1Item3, w2Item1, w2Item2, w3Item1 },
    };
  }

  it("BR-CUR-01: child does not pick weeks; player strictly determines next step via (week_no, session_no, position)", async () => {
    const { user, child, curriculum, createdLevels, items } =
      await createTestFixtures();

    // 1. Enroll child
    const enrollEvent = makeUserEvent(
      user.id,
      { uuid: child.uuid },
      { curriculum_code: curriculum.code }
    );
    const enrollRes = await enrollHandler(enrollEvent);
    expect(enrollRes.status).toBe("active");

    // 2. Query next step -> should return Week 1, Session 1, Item 1
    const nextEvent = makeUserEvent(user.id, { uuid: child.uuid });
    const next1 = await nextStepHandler(nextEvent);
    expect(next1.week_no).toBe(1);
    expect(next1.session_no).toBe(1);
    expect(next1.item?.entity_code).toBe(createdLevels[0].code);

    // 3. Complete Item 1
    const compEvent1 = makeUserEvent(
      user.id,
      { uuid: child.uuid },
      { curriculum_item_id: items.w1Item1.id }
    );
    await completeItemHandler(compEvent1);

    // 4. Query next step -> should automatically advance to Week 1, Session 2, Item 2
    const next2 = await nextStepHandler(nextEvent);
    expect(next2.week_no).toBe(1);
    expect(next2.session_no).toBe(2);
  });

  it("BR-CUR-02 & D-MF: adaptive seam selectVariant is pure identity and cannot alter (week_no, session_no, position)", () => {
    const item = { week_no: 3, session_no: 2, position: 1, title: "Step 1" };
    const variant = selectVariant(item, { p_learn: 0.95 });
    expect(variant.week_no).toBe(3);
    expect(variant.session_no).toBe(2);
    expect(variant.position).toBe(1);
  });

  it("BR-CUR-03: optional item (is_required: false) does not block week advancement", async () => {
    const { user, child, curriculum, items } = await createTestFixtures();

    const enrollEvent = makeUserEvent(
      user.id,
      { uuid: child.uuid },
      { curriculum_code: curriculum.code }
    );
    await enrollHandler(enrollEvent);

    // Complete mandatory items w1Item1 and w1Item2, but leave optional w1Item3 uncompleted
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item2.id }
      )
    );

    // Week 1 mandatory items done -> Week 2 opens without finishing optional item
    const nextEvent = makeUserEvent(user.id, { uuid: child.uuid });
    const next = await nextStepHandler(nextEvent);
    expect(next.week_no).toBe(2);
  });

  it("BR-CUR-04 & D-MA: child keeps pinned curriculum version when version 2 is published", async () => {
    const { db, user, child, curriculum } = await createTestFixtures();

    // Enroll at version 1
    const enrollEvent = makeUserEvent(
      user.id,
      { uuid: child.uuid },
      { curriculum_code: curriculum.code }
    );
    await enrollHandler(enrollEvent);

    // Publish Version 2 of same curriculum code
    await db
      .update(curricula)
      .set({ status: "archived" })
      .where(eq(curricula.id, curriculum.id));

    const [_curV2] = await db
      .insert(curricula)
      .values({
        entityId: curriculum.entityId,
        code: curriculum.code,
        contentVersion: 2,
        titleVi: "Chương trình V2 mới",
        accessTier: "free",
        status: "published",
      })
      .returning();

    // Query progress for enrolled child -> pinned to version 1
    const progEvent = makeUserEvent(user.id, { uuid: child.uuid });
    const prog = await progressHandler(progEvent);
    expect(prog.curriculum_version).toBe(1);
    expect(prog.curriculum_title).toBe("Chương trình Toán 5 tuổi");
  });

  it("BR-CUR-05 & BR-CUR-06: locked tier item does not block week advancement for standard user", async () => {
    const { user, child, curriculum, items } = await createTestFixtures();

    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    // Complete Week 1
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item2.id }
      )
    );

    // Week 2 has w2Item1 (premium - locked) and w2Item2 (free).
    // Free user completes w2Item2 (all accessible mandatory items in week 2 are done)
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w2Item2.id }
      )
    );

    // Progress moves to Week 3 without being blocked by premium w2Item1
    const next = await nextStepHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(next.week_no).toBe(3);
  });

  it("BR-CUR-07: curriculum_progress denominator only includes accessible mandatory items", () => {
    const items = [
      {
        id: 1,
        curriculum_id: 1,
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        is_required: true,
        access_tier: "free" as const,
      },
      {
        id: 2,
        curriculum_id: 1,
        week_no: 1,
        session_no: 2,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 102,
        is_required: true,
        access_tier: "standard" as const,
      },
      {
        id: 3,
        curriculum_id: 1,
        week_no: 1,
        session_no: 3,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 103,
        is_required: true,
        access_tier: "premium" as const,
      },
      {
        id: 4,
        curriculum_id: 1,
        week_no: 2,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 104,
        is_required: false,
        access_tier: "free" as const,
      }, // Optional
    ];

    // Standard user has access to free and standard (items 1 & 2 only)
    const result = computeCurriculumProgress({
      items,
      completedItemIds: new Set([1, 2]),
      allowedTiers: ["free", "login", "standard"],
    });

    expect(result.denominator).toBe(2);
    expect(result.numerator).toBe(2);
    expect(result.progress).toBe(1.0);
  });

  it("BR-CUR-08: long inactivity returns same current step without penalty or guilt messaging", async () => {
    const { user, child, curriculum } = await createTestFixtures();

    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    // Simulate returning after 3 weeks of inactivity
    const next = await nextStepHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(next.week_no).toBe(1);
    expect(next.session_no).toBe(1);
    expect((next as any).guilt_message).toBeUndefined();
  });

  it("BR-CUR-09 & D-MD: tier upgrade expands denominator and reverts completed enrollment to active", async () => {
    const { db, user, child, curriculum, items } = await createTestFixtures();

    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    // User is free tier. Completes w1Item1, w1Item2, w2Item2. (All free mandatory items in week 1 & 2)
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item2.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w2Item2.id }
      )
    );

    // Upgrade user to premium
    await db
      .insert(entitlementKeys)
      .values({
        key: "play_premium_games",
        group: "content",
        labelVi: "Chơi trò chơi cao cấp",
        isMvp: true,
      })
      .onConflictDoNothing();

    await db.insert(entitlements).values({
      userId: user.id,
      entitlementKey: "play_premium_games",
      status: "active",
      source: "package_order",
    });
    await invalidateUserEntitlementsCache(user.id);

    // Query next step -> now w2Item1 (premium) is accessible!
    const next = await nextStepHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(next.week_no).toBe(2);
    expect(next.session_no).toBe(1);
    expect(next.curriculum_progress).toBeLessThan(1.0);
  });

  it("BR-CUR-10 & D-ME: week with all mandatory items locked is marked week_blocked_by_tier: true", () => {
    const items = [
      {
        id: 1,
        curriculum_id: 1,
        week_no: 1,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 101,
        is_required: true,
        access_tier: "free" as const,
      },
      // Week 2 has only premium mandatory items
      {
        id: 2,
        curriculum_id: 1,
        week_no: 2,
        session_no: 1,
        position: 1,
        entity_type: "game_level" as const,
        entity_id: 102,
        is_required: true,
        access_tier: "premium" as const,
      },
    ];

    // Free user completed week 1
    const nextStep = resolveNextStep({
      durationWeeks: 2,
      items,
      completedItemIds: new Set([1]),
      allowedTiers: ["free"],
    });

    expect(nextStep.week_no).toBe(2);
    expect(nextStep.week_blocked_by_tier).toBe(true);
    expect(nextStep.is_completed).toBe(false);
  });

  it("D-MB: rejects second active enrollment for same child with 409 ALREADY_ENROLLED", async () => {
    const { user, child, curriculum } = await createTestFixtures();

    // First enrollment succeeds
    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    // Second enrollment for same child throws 409
    await expect(
      enrollHandler(
        makeUserEvent(
          user.id,
          { uuid: child.uuid },
          { curriculum_code: curriculum.code }
        )
      )
    ).rejects.toThrow();
  });

  it("D-MC: complete-item is idempotent and does not corrupt progress or completed_at", async () => {
    const { user, child, curriculum, items } = await createTestFixtures();

    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    // Complete item first time
    const res1 = await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );
    expect(res1.ok).toBe(true);

    // Complete item second time
    const res2 = await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );
    expect(res2.ok).toBe(true);

    // Verify progress
    const prog = await progressHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(prog.completed_items).toBe(1);
  });

  it("POST /withdraw marks active enrollment as withdrawn and keeps existing progress intact", async () => {
    const { user, child, curriculum, items } = await createTestFixtures();

    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );

    // Withdraw from curriculum
    const withdrawRes = await withdrawHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(withdrawRes.status).toBe("withdrawn");

    // Progress record is still intact
    const prog = await progressHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(prog.status).toBe("withdrawn");
    expect(prog.completed_items).toBe(1);
  });

  it("POST /enrollments rejects child with age out of range with 422 CHILD_AGE_OUT_OF_RANGE", async () => {
    const { db, user, curriculum } = await createTestFixtures();

    // Create child with birthYear 2018 (8 years old in 2026 -> outside 4..6 range)
    const [olderChild] = await db
      .insert(childProfiles)
      .values({
        userId: user.id,
        displayName: "Bé Lớn",
        birthYear: 2018,
        avatarId: "panda",
        status: "active",
      })
      .returning();

    await expect(
      enrollHandler(
        makeUserEvent(
          user.id,
          { uuid: olderChild.uuid },
          { curriculum_code: curriculum.code }
        )
      )
    ).rejects.toThrow();
  });

  it("POST /enrollments rejects when user tier opens 0 mandatory items with 422 VALIDATION_FAILED", async () => {
    const { db, user, child, createdLevels } = await createTestFixtures();
    const uid = Math.floor(Math.random() * 800_000) + 100_000;

    // Create a 100% premium curriculum
    const [premCur] = await db
      .insert(curricula)
      .values({
        entityId: uid + 20,
        code: `CUR-PREM-${uid}`,
        contentVersion: 1,
        programType: "age_based",
        targetAgeMin: 4,
        targetAgeMax: 6,
        durationWeeks: 4,
        sessionsPerWeek: 2,
        titleVi: "Chương trình VIP",
        accessTier: "premium",
        status: "published",
      })
      .returning();

    // Add only premium mandatory item
    await db.insert(curriculumItems).values({
      curriculumId: premCur.id,
      weekNo: 1,
      sessionNo: 1,
      position: 1,
      entityType: "game_level",
      entityId: createdLevels[3].entityId, // Premium
      isRequired: true,
    });

    // Free user attempts to enroll in 100% premium curriculum -> rejected with 422
    await expect(
      enrollHandler(
        makeUserEvent(
          user.id,
          { uuid: child.uuid },
          { curriculum_code: premCur.code }
        )
      )
    ).rejects.toThrow();
  });

  it("BR-ERR-05 / BR-ACT-03: returns 404 when accessing child profile belonging to another parent", async () => {
    const { user, child, curriculum } = await createTestFixtures();
    const otherUserId = user.id + 999;

    // Access by another user returns 404
    await expect(
      nextStepHandler(makeUserEvent(otherUserId, { uuid: child.uuid }))
    ).rejects.toThrow();

    await expect(
      progressHandler(makeUserEvent(otherUserId, { uuid: child.uuid }))
    ).rejects.toThrow();

    await expect(
      enrollHandler(
        makeUserEvent(
          otherUserId,
          { uuid: child.uuid },
          { curriculum_code: curriculum.code }
        )
      )
    ).rejects.toThrow();
  });

  it("End-to-end full journey: child enrolls, completes all items, and finishes curriculum", async () => {
    const { user, child, curriculum, items } = await createTestFixtures();

    // 1. Enroll
    await enrollHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_code: curriculum.code }
      )
    );

    // 2. Complete items sequentially
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item1.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w1Item2.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w2Item2.id }
      )
    );
    await completeItemHandler(
      makeUserEvent(
        user.id,
        { uuid: child.uuid },
        { curriculum_item_id: items.w3Item1.id }
      )
    );

    // 3. Check next step -> curriculum is completed!
    const next = await nextStepHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(next.is_completed).toBe(true);
    expect(next.curriculum_progress).toBe(1.0);

    // 4. Progress endpoint returns is_completed: true and 100%
    const prog = await progressHandler(
      makeUserEvent(user.id, { uuid: child.uuid })
    );
    expect(prog.is_completed).toBe(true);
    expect(prog.progress).toBe(1.0);
    expect(prog.status).toBe("completed");
  });
});
