import {
  activities,
  getOwnerDb,
  lessonActivities,
  lessons,
  managers,
} from "@mindkid/db";
import { beforeAll, describe, expect, it } from "vitest";
import teachingViewHandler from "#server/api/managers/lessons/[code]/[version]/teaching-view.get";
import lessonVersionHandler from "#server/api/managers/lessons/[code]/[version].get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

let managerId = 1;

function randomId(): number {
  return Math.floor(Math.random() * 900_000_000) + 100_000;
}

/**
 * `check_lessons_code_format` và `check_activities_code_format` chỉ nhận
 * `LES-\d{4}` / `ACT-\d{4}`, và `(code, content_version)` là UNIQUE. Không gian
 * mã chỉ có 10.000 chỗ và seed đã chiếm phần lớn, nên phải thử lại khi đụng
 * 23505 thay vì tin vào một mã ngẫu nhiên.
 */
function isUniqueViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: string } })?.cause;
  return (
    (error as { code?: string })?.code === "23505" ||
    cause?.code === "23505" ||
    String((error as { message?: string })?.message ?? "").includes(
      "duplicate key"
    )
  );
}

function nextCode(prefix: string): string {
  return `${prefix}-${String(Math.floor(Math.random() * 10_000)).padStart(4, "0")}`;
}

async function insertWithFreeCode<T>(
  prefix: string,
  insert: (code: string) => Promise<T>
): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      return await insert(nextCode(prefix));
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

function mockEvent(params: Record<string, string>) {
  const headers: Record<string, string> = {};
  return {
    method: "GET",
    node: {
      req: {
        method: "GET",
        url: "/api/test",
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        statusCode: 200,
        setHeader: (k: string, v: string) => {
          headers[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headers[k.toLowerCase()],
        end: () => {
          /* no-op */
        },
      },
    },
    context: {
      manager: {
        manager_id: managerId,
        id: managerId,
        display_name: "Lesson Detail Tester",
        session_id: "sess_lesson_detail",
        role: "super_admin",
      },
      params,
    },
  } as any;
}

/**
 * Cả hai route đều resolve "bản mới nhất theo `entity_id`" cho từng activity
 * đính kèm. Fixture dựng đúng cái bẫy đó: mỗi activity có hai bản, và chỉ bản
 * `content_version` cao hơn được trả về.
 */
async function seedLessonWithVersionedActivities(): Promise<{
  lessonCode: string;
  entityIds: number[];
}> {
  const db = getOwnerDb();

  const lesson = await insertWithFreeCode("LES", async (code) => {
    const [row] = await db
      .insert(lessons)
      .values({
        entityId: randomId(),
        code,
        contentVersion: 1,
        title: "Bài học kiểm thử chi tiết",
        guide: "Hướng dẫn",
        targetAgeMin: 3,
        targetAgeMax: 6,
        estimatedMinutes: 20,
        accessTier: "free",
        status: "draft",
        materials: "giấy, bút",
      })
      .returning();
    return row;
  });

  const entityIds: number[] = [];
  for (let index = 0; index < 3; index++) {
    const entityId = randomId();
    entityIds.push(entityId);

    // Hai bản cùng `entity_id`, khác `content_version`: route phải chọn bản 2.
    await insertWithFreeCode("ACT", async (code) => {
      await db.insert(activities).values([
        {
          entityId,
          code,
          contentVersion: 1,
          kind: "manipulative",
          title: `Hoạt động ${index} bản 1`,
          instruction: "Hướng dẫn",
          materials: "vật liệu cũ",
          estimatedMinutes: 20,
          accessTier: "free",
          status: "draft",
        },
        {
          entityId,
          code,
          contentVersion: 2,
          kind: "manipulative",
          title: `Hoạt động ${index} bản 2`,
          instruction: "Hướng dẫn",
          materials: `vật liệu-${index}`,
          estimatedMinutes: 5,
          accessTier: "free",
          status: "draft",
        },
      ]);
    });

    await db.insert(lessonActivities).values({
      lessonId: lesson.id,
      activityId: entityId,
      position: index + 1,
      isRequired: true,
    });
  }

  return { lessonCode: lesson.code, entityIds };
}

beforeAll(async () => {
  const db = getOwnerDb();
  const [existing] = await db.select().from(managers).limit(1);
  if (existing) {
    managerId = existing.id;
    return;
  }
  const [created] = await db
    .insert(managers)
    .values({
      email: `lesson_detail_${randomId()}@example.com`,
      passwordHash: "x",
      displayName: "Lesson Detail Tester",
      role: "super_admin",
    })
    .returning();
  managerId = created.id;
});

describe("GET /api/managers/lessons/{code}/{version}", () => {
  it("resolves every attached activity at its latest content version", async () => {
    const { lessonCode, entityIds } = await seedLessonWithVersionedActivities();

    const res = await lessonVersionHandler(
      mockEvent({ code: lessonCode, version: "1" })
    );

    expect(res.activities).toHaveLength(3);
    expect(res.activities.map((a: { position: number }) => a.position)).toEqual(
      [1, 2, 3]
    );
    for (const item of res.activities) {
      expect(entityIds).toContain(item.activity_id);
      expect(item.activity).not.toBeNull();
      expect(item.activity.entityId).toBe(item.activity_id);
      expect(item.activity.contentVersion).toBe(2);
      expect(item.is_required).toBe(true);
    }
  });

  it("returns 404 for an unknown lesson code", async () => {
    await expect(
      lessonVersionHandler(mockEvent({ code: "LES-NOPE-000", version: "1" }))
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("keeps an attachment whose activity row is missing, with activity null", async () => {
    const db = getOwnerDb();
    const lesson = await insertWithFreeCode("LES", async (code) => {
      const [row] = await db
        .insert(lessons)
        .values({
          entityId: randomId(),
          code,
          contentVersion: 1,
          title: "Bài học có đính kèm mồ côi",
          guide: "Hướng dẫn",
          targetAgeMin: 3,
          targetAgeMax: 6,
          estimatedMinutes: 20,
          accessTier: "free",
          status: "draft",
        })
        .returning();
      return row;
    });
    await db.insert(lessonActivities).values({
      lessonId: lesson.id,
      activityId: randomId(),
      position: 1,
      isRequired: false,
    });

    const res = await lessonVersionHandler(
      mockEvent({ code: lesson.code, version: "1" })
    );

    expect(res.activities).toHaveLength(1);
    expect(res.activities[0].activity).toBeNull();
  });
});

describe("GET /api/managers/lessons/{code}/{version}/teaching-view", () => {
  it("sums minutes and unions materials from the latest activity versions", async () => {
    const { lessonCode } = await seedLessonWithVersionedActivities();

    const res = await teachingViewHandler(
      mockEvent({ code: lessonCode, version: "1" })
    );

    expect(res.activities).toHaveLength(3);
    for (const item of res.activities) {
      expect(item.activity.contentVersion).toBe(2);
      expect(item.is_offscreen).toBe(true);
    }
    // 3 × 5 phút của bản 2, không phải 3 × 20 phút của bản 1.
    expect(res.total_activity_minutes).toBe(15);
    expect(res.materials_union).toEqual(
      expect.arrayContaining(["giấy", "bút"])
    );
    expect(res.materials_union).not.toContain("vật liệu cũ");
  });

  it("returns 404 for an unknown lesson code", async () => {
    await expect(
      teachingViewHandler(mockEvent({ code: "LES-NOPE-000", version: "1" }))
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
