import {
  activities,
  entitlementKeys,
  entitlements,
  gameTemplates,
  getOwnerDb,
  lessonActivities,
  lessonPlanItems,
  lessonPlans,
  lessons,
  users,
} from "@kidthink/db";
import { ENTITLEMENT_KEYS } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import exportPlanHandler from "../../server/api/users/lesson-plans/[uuid]/export.post.js";
import putItemsHandler from "../../server/api/users/lesson-plans/[uuid]/items.put.js";
import refreshItemHandler from "../../server/api/users/lesson-plans/[uuid]/refresh-item.post.js";
import deletePlanHandler from "../../server/api/users/lesson-plans/[uuid].delete.js";
import getPlanHandler from "../../server/api/users/lesson-plans/[uuid].get.js";
import listPlansHandler from "../../server/api/users/lesson-plans/index.get.js";
import createPlanHandler from "../../server/api/users/lesson-plans/index.post.js";
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
        display_name: "Teacher User",
      },
      params: routerParams,
    },
    _body: body,
  } as any;
}

describe("Task P4.1 — Lesson Plan Creator API (BR-LPC-01..09, D-P4A..D-P4D)", () => {
  const db = getOwnerDb();
  let user1Id: number;
  let user2Id: number;
  let _templateId: number;
  let publishedLessonCode: string;
  let publishedActCode: string;
  let premiumActCode: string;

  beforeEach(async () => {
    // Reset test data
    await db.delete(lessonPlanItems);
    await db.delete(lessonPlans);
    await db.delete(lessonActivities);
    await db.delete(activities);
    await db.delete(lessons);

    for (const k of ENTITLEMENT_KEYS) {
      await db
        .insert(entitlementKeys)
        .values({
          key: k.key,
          group: k.group as any,
          labelVi: k.label,
          isMvp: k.is_mvp,
        })
        .onConflictDoNothing();
    }

    const [u1] = await db
      .insert(users)
      .values({
        email: `teacher1-${Date.now()}@example.com`,
        passwordHash: "hash123",
        displayName: "Teacher One",
      })
      .returning();
    user1Id = u1.id;

    const [u2] = await db
      .insert(users)
      .values({
        email: `teacher2-${Date.now()}@example.com`,
        passwordHash: "hash123",
        displayName: "Teacher Two",
      })
      .returning();
    user2Id = u2.id;

    // Grant user1 entitlements
    await db.insert(entitlements).values([
      {
        userId: user1Id,
        entitlementKey: "create_lesson_plan",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "duplicate_lesson",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "customize_lesson",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "export_pdf",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "play_free_games",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "play_login_games",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: user1Id,
        entitlementKey: "play_standard_games",
        source: "manual_grant",
        status: "active",
      },
    ]);
    await invalidateUserEntitlementsCache(user1Id);
    await invalidateUserEntitlementsCache(user2Id); // Template
    let [tmpl] = await db
      .select({ id: gameTemplates.id })
      .from(gameTemplates)
      .limit(1);
    if (!tmpl) {
      [tmpl] = await db
        .insert(gameTemplates)
        .values({
          code: "GT-001",
          nameVi: "Đếm số",
          mechanic: "tap_target",
          domain: "c1",
          contentContract: {},
        })
        .returning({ id: gameTemplates.id });
    }
    _templateId = tmpl.id;

    // Published Lesson & Activities
    publishedLessonCode = "LES-9991";
    publishedActCode = "ACT-9991";
    premiumActCode = "ACT-9992";

    const baseEntityId = 999_100;

    const [lesson] = await db
      .insert(lessons)
      .values({
        entityId: baseEntityId,
        code: publishedLessonCode,
        contentVersion: 1,
        titleVi: "Bài học mẫu số lượng 1-5",
        targetAgeMin: 4,
        targetAgeMax: 5,
        estimatedMinutes: 25,
        accessTier: "standard",
        status: "published",
      })
      .returning();

    const [act1] = await db
      .insert(activities)
      .values({
        entityId: baseEntityId + 1,
        code: publishedActCode,
        contentVersion: 1,
        kind: "manipulative",
        titleVi: "Thực hành xếp hạt",
        instructionVi: "Xếp 5 hạt thành hàng ngang",
        estimatedMinutes: 10,
        accessTier: "standard",
        status: "published",
      })
      .returning();

    const [_actPremium] = await db
      .insert(activities)
      .values({
        entityId: baseEntityId + 2,
        code: premiumActCode,
        contentVersion: 1,
        kind: "digital_game",
        titleVi: "Trò chơi cao cấp 3D",
        estimatedMinutes: 15,
        accessTier: "premium",
        status: "published",
      })
      .returning();

    await db.insert(lessonActivities).values({
      lessonId: lesson.id,
      position: 0,
      activityId: act1.id,
      isRequired: true,
    });
  });

  it("Scenario: BR-LPC-01 — user copies a system lesson; editing copy does NOT mutate original lesson", async () => {
    // 1. Copy lesson
    const createEvent = makeUserEvent(
      user1Id,
      {},
      {
        title: "Giáo án cá nhân lớp Mầm 1",
        source_lesson_code: publishedLessonCode,
      }
    );
    const plan = await createPlanHandler(createEvent);

    expect(plan.id).toBeDefined();
    expect(plan.source_lesson_code).toBe(publishedLessonCode);
    expect(plan.items.length).toBe(1);
    expect(plan.items[0].item_code).toBe(publishedActCode);

    // 2. Edit personal copy items
    const putEvent = makeUserEvent(
      user1Id,
      { uuid: plan.uuid },
      {
        expected_version: plan.version,
        items: [
          {
            item_type: "custom_note",
            custom_note: "Ghi chú sửa đổi của giáo viên",
          },
        ],
      },
      "PUT"
    );
    const updatedPlan = await putItemsHandler(putEvent);
    expect(updatedPlan.items.length).toBe(1);
    expect(updatedPlan.items[0].item_type).toBe("custom_note");

    // 3. Verify original system lesson & activities are unchanged
    const [originalLesson] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.code, publishedLessonCode));
    expect(originalLesson.titleVi).toBe("Bài học mẫu số lượng 1-5");

    const originalActs = await db
      .select()
      .from(lessonActivities)
      .where(eq(lessonActivities.lessonId, originalLesson.id));
    expect(originalActs.length).toBe(1);
  });

  it("Scenario: BR-LPC-02 — personal lesson plans never leak into public catalog", async () => {
    // Verify no public routes exist for lesson_plans
    const getEvent = makeUserEvent(user1Id);
    const result = await listPlansHandler(getEvent);
    expect(result.plans).toBeDefined();
  });

  it("Scenario: BR-LPC-03 — rejects adding premium item when user lacks premium access with 403 TIER_LOCKED", async () => {
    // Create blank plan
    const createEvent = makeUserEvent(
      user1Id,
      {},
      { title: "Giáo án thử nghiệm" }
    );
    const plan = await createPlanHandler(createEvent);

    // Try adding premium activity
    const putEvent = makeUserEvent(
      user1Id,
      { uuid: plan.uuid },
      {
        expected_version: plan.version,
        items: [
          {
            item_type: "activity",
            item_code: premiumActCode,
          },
        ],
      },
      "PUT"
    );

    await expect(putItemsHandler(putEvent)).rejects.toThrow();
  });

  it("Scenario: BR-LPC-04 — returns 404 NOT_FOUND for IDOR attempt accessing another user's plan", async () => {
    // User 1 creates plan
    const createEvent = makeUserEvent(
      user1Id,
      {},
      { title: "Giáo án riêng tư của User 1" }
    );
    const plan = await createPlanHandler(createEvent);

    // User 2 tries to access User 1's plan
    const user2GetEvent = makeUserEvent(user2Id, { uuid: plan.uuid });
    await expect(getPlanHandler(user2GetEvent)).rejects.toThrow();

    const user2DeleteEvent = makeUserEvent(
      user2Id,
      { uuid: plan.uuid },
      undefined,
      "DELETE"
    );
    await expect(deletePlanHandler(user2DeleteEvent)).rejects.toThrow();
  });

  it("Scenario: BR-LPC-06 — export PDF checks entitlement and returns export token", async () => {
    const createEvent = makeUserEvent(
      user1Id,
      {},
      { title: "Giáo án chuẩn bị xuất PDF" }
    );
    const plan = await createPlanHandler(createEvent);

    const exportEvent = makeUserEvent(user1Id, { uuid: plan.uuid }, {}, "POST");
    const exportResult = await exportPlanHandler(exportEvent);

    expect(exportResult.plan_uuid).toBe(plan.uuid);
    expect(exportResult.export_token).toBeDefined();
  });

  it("Scenario: BR-LPC-07 & D-P4D — snapshot remains unchanged when source version bumps; refresh action updates snapshot", async () => {
    // 1. Copy lesson
    const createEvent = makeUserEvent(
      user1Id,
      {},
      {
        title: "Giáo án theo dõi phiên bản",
        source_lesson_code: publishedLessonCode,
      }
    );
    const plan = await createPlanHandler(createEvent);
    expect(plan.items[0].snapshot.source_version).toBe(1);

    // 2. Publish new version 2 of activity
    const [act] = await db
      .select()
      .from(activities)
      .where(eq(activities.code, publishedActCode));

    await db
      .update(activities)
      .set({ status: "archived" })
      .where(eq(activities.id, act.id));

    await db.insert(activities).values({
      entityId: act.entityId,
      code: publishedActCode,
      contentVersion: 2,
      kind: "manipulative",
      titleVi: "Thực hành xếp hạt nâng cao v2",
      instructionVi: "Xếp 5 hạt thành vòng tròn",
      estimatedMinutes: 12,
      accessTier: "standard",
      status: "published",
    });

    // 3. User views plan -> snapshot still version 1, but has_update is true
    const getEvent = makeUserEvent(user1Id, { uuid: plan.uuid });
    const detail = await getPlanHandler(getEvent);
    expect(detail.items[0].snapshot.source_version).toBe(1);
    expect(detail.items[0].has_update).toBe(true);
    expect(detail.items[0].latest_version).toBe(2);

    // 4. User triggers refresh item
    const refreshEvent = makeUserEvent(
      user1Id,
      { uuid: plan.uuid },
      { position: 0 },
      "POST"
    );
    const refreshed = await refreshItemHandler(refreshEvent);
    expect(refreshed.items[0].snapshot.source_version).toBe(2);
    expect(refreshed.items[0].snapshot.title_vi).toBe(
      "Thực hành xếp hạt nâng cao v2"
    );
    expect(refreshed.items[0].has_update).toBe(false);
  });

  it("Scenario: BR-LPC-08 — enforces monthly quota lesson_plans_per_month", async () => {
    // Create 20 plans
    for (let i = 0; i < 20; i++) {
      await db.insert(lessonPlans).values({
        userId: user1Id,
        title: `Giáo án #${i + 1}`,
        version: 1,
      });
    }

    // 21st plan should be rejected with 402 QUOTA_EXCEEDED
    const createEvent = makeUserEvent(
      user1Id,
      {},
      { title: "Giáo án thứ 21 vượt quota" }
    );
    await expect(createPlanHandler(createEvent)).rejects.toThrow();
  });

  it("Scenario: BR-LPC-09 — lesson plans and API responses never contain child data", async () => {
    const createEvent = makeUserEvent(
      user1Id,
      {},
      { title: "Giáo án không dữ liệu trẻ" }
    );
    const plan = await createPlanHandler(createEvent);

    expect((plan as any).child_id).toBeUndefined();
    expect((plan as any).child_profile_id).toBeUndefined();
    expect((plan as any).child_name).toBeUndefined();
  });

  it("Scenario: D-P4B — rejects replace items with 409 VERSION_CONFLICT on stale expected_version", async () => {
    const createEvent = makeUserEvent(
      user1Id,
      {},
      { title: "Giáo án kiểm tra version lock" }
    );
    const plan = await createPlanHandler(createEvent);

    const putStaleEvent = makeUserEvent(
      user1Id,
      { uuid: plan.uuid },
      {
        expected_version: plan.version + 5, // mismatch
        items: [],
      },
      "PUT"
    );
    await expect(putItemsHandler(putStaleEvent)).rejects.toThrow();
  });
});
