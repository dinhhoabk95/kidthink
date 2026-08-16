import {
  childProfiles,
  curricula,
  curriculumItems,
  entitlementKeys,
  entitlements,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  lessons,
  users,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import enrollPersonalHandler from "../../server/api/users/children/[uuid]/enroll-personal.post.js";
import completeItemHandler from "../../server/api/users/children/[uuid]/personal-curriculum/complete-item.post.js";
import nextStepHandler from "../../server/api/users/children/[uuid]/personal-curriculum/next-step.get.js";
import getBalanceHandler from "../../server/api/users/curricula/[uuid]/balance.get.js";
import deleteCurriculumHandler from "../../server/api/users/curricula/[uuid]/index.delete.js";
import getCurriculumHandler from "../../server/api/users/curricula/[uuid]/index.get.js";
import putCurriculumHandler from "../../server/api/users/curricula/[uuid]/index.put.js";
import putItemsHandler from "../../server/api/users/curricula/[uuid]/items.put.js";
import copyCurriculumHandler from "../../server/api/users/curricula/copy.post.js";
import listCurriculaHandler from "../../server/api/users/curricula/index.get.js";
import createCurriculumHandler from "../../server/api/users/curricula/index.post.js";
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
        display_name: "Test Parent User",
      },
      params: routerParams,
      body,
    },
    _body: body,
  } as any;
}

describe("Personal Curriculum API Endpoints (Task #65 / P4.4)", () => {
  let userAId: number;
  let userBId: number;
  let childAUuid: string;
  let childBUuid: string;
  let standardGameLevelId: number;
  let publishedLessonId: number;
  let systemCurriculumCode: string;

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();

    // 1. Seed users
    const [uA] = await db
      .insert(users)
      .values({
        email: `api_pcu_a_${ts}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User A",
      })
      .returning();
    userAId = uA.id;

    const [uB] = await db
      .insert(users)
      .values({
        email: `api_pcu_b_${ts}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User B",
      })
      .returning();
    userBId = uB.id;

    // Grant entitlement to userA
    await db
      .insert(entitlementKeys)
      .values([
        {
          key: "create_custom_curriculum",
          group: "creator",
          labelVi: "Tạo lộ trình cá nhân",
        },
        {
          key: "play_standard_games",
          group: "content",
          labelVi: "Chơi game chuẩn",
        },
      ])
      .onConflictDoNothing();

    await db.insert(entitlements).values([
      {
        userId: userAId,
        entitlementKey: "create_custom_curriculum",
        source: "manual_grant",
        status: "active",
      },
      {
        userId: userAId,
        entitlementKey: "play_standard_games",
        source: "manual_grant",
        status: "active",
      },
    ]);

    await invalidateUserEntitlementsCache(userAId);

    // 2. Seed child profiles
    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId: userAId,
        displayName: "Bé An",
        birthYear: 2021,
        avatarId: "bear",
      })
      .returning();
    childAUuid = cA.uuid;

    const [cB] = await db
      .insert(childProfiles)
      .values({
        userId: userBId,
        displayName: "Bé Bình",
        birthYear: 2021,
        avatarId: "rabbit",
      })
      .returning();
    childBUuid = cB.uuid;

    // 3. Seed template & game level
    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-998",
        nameVi: "Game template test API",
        mechanic: "drag_drop",
        contentContract: {},
      })
      .onConflictDoNothing()
      .returning();
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
        titleVi: "Đếm số mẫu",
        accessTier: "standard",
        status: "published",
        contentPack: {},
        difficultyParams: {},
      })
      .returning();
    standardGameLevelId = gl.id;

    // 4. Seed lesson
    let lesCode = `LES-${String(Math.floor(1000 + Math.random() * 8999))}`;
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = `LES-${String(Math.floor(1000 + Math.random() * 8999))}`;
      const existing = await db
        .select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.code, candidate))
        .limit(1);
      if (existing.length === 0) {
        lesCode = candidate;
        break;
      }
    }

    const [les] = await db
      .insert(lessons)
      .values({
        code: lesCode,
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        titleVi: "Bài học hình khối",
        accessTier: "standard",
        status: "published",
        estimatedMinutes: 20,
        version: 1,
      })
      .returning();
    publishedLessonId = les.id;

    // 5. Seed system curriculum
    systemCurriculumCode =
      `CUR-SYS-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`.slice(
        0,
        50
      );
    const [sysCurr] = await db
      .insert(curricula)
      .values({
        code: systemCurriculumCode,
        entityId: Math.floor(100_000 + Math.random() * 800_000),
        titleVi: "Chương trình mẫu hệ thống",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();

    await db.insert(curriculumItems).values([
      {
        curriculumId: sysCurr.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: standardGameLevelId,
        isRequired: true,
      },
    ]);
  });

  it("tạo mới, đọc danh sách, xem chi tiết và cập nhật lộ trình học cá nhân", async () => {
    // 1. POST /api/users/curricula
    const createEv = makeUserEvent(
      userAId,
      {},
      {
        title: "Lộ trình học thử nghiệm",
        age_min: 4,
        age_max: 5,
        duration_weeks: 4,
        sessions_per_week: 2,
        items: [
          {
            week_no: 1,
            session_no: 1,
            position: 1,
            entity_type: "game_level",
            entity_id: standardGameLevelId,
          },
        ],
      }
    );

    const created = await createCurriculumHandler(createEv);
    expect(created.uuid).toBeDefined();
    expect(created.title).toBe("Lộ trình học thử nghiệm");
    expect(created.status).toBe("draft");
    expect(created.items.length).toBe(1);

    const curriculumUuid = created.uuid;

    // 2. GET /api/users/curricula
    const listEv = makeUserEvent(userAId);
    const list = await listCurriculaHandler(listEv);
    expect(list.items.length).toBeGreaterThanOrEqual(1);
    expect(list.items.some((i: any) => i.uuid === curriculumUuid)).toBe(true);

    // 3. GET /api/users/curricula/:uuid
    const getEv = makeUserEvent(userAId, { uuid: curriculumUuid });
    const detail = await getCurriculumHandler(getEv);
    expect(detail.uuid).toBe(curriculumUuid);
    expect(detail.balance).toBeDefined();

    // 4. GET /api/users/curricula/:uuid/balance
    const balanceEv = makeUserEvent(userAId, { uuid: curriculumUuid });
    const balanceRes = await getBalanceHandler(balanceEv);
    expect(balanceRes.balance).toBeDefined();
    expect(balanceRes.warnings).toBeDefined();

    // 5. PUT /api/users/curricula/:uuid
    const putEv = makeUserEvent(
      userAId,
      { uuid: curriculumUuid },
      {
        title: "Lộ trình hoàn chỉnh",
        status: "ready",
        expected_version: 1,
      },
      "PUT"
    );
    const updated = await putCurriculumHandler(putEv);
    expect(updated.title).toBe("Lộ trình hoàn chỉnh");
    expect(updated.status).toBe("ready");
    expect(updated.version).toBe(2);

    // 6. PUT /api/users/curricula/:uuid/items
    const putItemsEv = makeUserEvent(
      userAId,
      { uuid: curriculumUuid },
      {
        items: [
          {
            week_no: 1,
            session_no: 1,
            position: 1,
            entity_type: "game_level",
            entity_id: standardGameLevelId,
          },
          {
            week_no: 1,
            session_no: 2,
            position: 1,
            entity_type: "lesson",
            entity_id: publishedLessonId,
          },
        ],
        expected_version: 2,
      },
      "PUT"
    );
    const updatedItems = await putItemsHandler(putItemsEv);
    expect(updatedItems.items.length).toBe(2);
    expect(updatedItems.version).toBe(3);

    // 7. Ghi danh trẻ: POST /api/users/children/:uuid/enroll-personal
    const enrollEv = makeUserEvent(
      userAId,
      { uuid: childAUuid },
      { personal_curriculum_uuid: curriculumUuid }
    );
    const enrollRes = await enrollPersonalHandler(enrollEv);
    expect(enrollRes.status).toBe("active");

    // 8. Tra cứu bước kế tiếp: GET /api/users/children/:uuid/personal-curriculum/next-step
    const nextStepEv = makeUserEvent(userAId, { uuid: childAUuid });
    const nextStepRes = await nextStepHandler(nextStepEv);
    expect(nextStepRes.active_enrollment?.title).toBe("Lộ trình hoàn chỉnh");
    expect(nextStepRes.next_step?.week_no).toBe(1);
    expect(nextStepRes.next_step?.session_no).toBe(1);

    // 9. Hoàn thành mục: POST /api/users/children/:uuid/personal-curriculum/complete-item
    const firstItemId = updatedItems.items[0].id;
    const compEv = makeUserEvent(
      userAId,
      { uuid: childAUuid },
      {
        personal_curriculum_item_id: firstItemId,
      }
    );
    const compRes = await completeItemHandler(compEv);
    expect(compRes.ok).toBe(true);

    // 10. Xoá lộ trình: DELETE /api/users/curricula/:uuid
    const delEv = makeUserEvent(
      userAId,
      { uuid: curriculumUuid },
      undefined,
      "DELETE"
    );
    const delRes = await deleteCurriculumHandler(delEv);
    expect(delRes.ok).toBe(true);
  });

  it("sao chép lộ trình hệ thống qua POST /api/users/curricula/copy", async () => {
    const copyEv = makeUserEvent(
      userAId,
      {},
      {
        system_curriculum_code: systemCurriculumCode,
        title: "Bản sao từ API test",
      }
    );

    const copied = await copyCurriculumHandler(copyEv);
    expect(copied.title).toBe("Bản sao từ API test");
    expect(copied.status).toBe("draft");
    expect(copied.items.length).toBe(1);
  });

  it("ngăn chặn IDOR: trả về 404 khi truy vấn lộ trình hoặc trẻ của người khác", async () => {
    const createEv = makeUserEvent(
      userAId,
      {},
      {
        title: "Lộ trình riêng tư A",
      }
    );
    const created = await createCurriculumHandler(createEv);

    // User B cố đọc lộ trình của User A -> 404
    const getEv = makeUserEvent(userBId, { uuid: created.uuid });
    await expect(getCurriculumHandler(getEv)).rejects.toMatchObject({
      statusCode: 404,
    });

    // User B cố ghi danh trẻ của User A -> 404
    const enrollEv = makeUserEvent(
      userBId,
      { uuid: childAUuid },
      { personal_curriculum_uuid: created.uuid }
    );
    await expect(enrollPersonalHandler(enrollEv)).rejects.toMatchObject({
      statusCode: 404,
    });

    // User A cố ghi danh trẻ của User B -> 404
    const enrollWrongChildEv = makeUserEvent(
      userAId,
      { uuid: childBUuid },
      { personal_curriculum_uuid: created.uuid }
    );
    await expect(
      enrollPersonalHandler(enrollWrongChildEv)
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
