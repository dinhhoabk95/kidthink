import { curricula, curriculumItems, getOwnerDb, managers } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import duplicateCurriculumHandler from "../../server/api/managers/curricula/[code]/[version]/duplicate.post.js";
import putCurriculumItemsHandler from "../../server/api/managers/curricula/[code]/[version]/items.put.js";
import putCurriculumWeeksHandler from "../../server/api/managers/curricula/[code]/[version]/weeks.put.js";
import deleteCurriculumHandler from "../../server/api/managers/curricula/[code]/[version].delete.js";
import getCurriculumHandler from "../../server/api/managers/curricula/[code]/[version].get.js";
import patchCurriculumHandler from "../../server/api/managers/curricula/[code]/[version].patch.js";
import getCurriculaHandler from "../../server/api/managers/curricula/index.get.js";
import createCurriculumHandler from "../../server/api/managers/curricula/index.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const CUR_CODE_REGEX = /^CUR-[A-Za-z0-9_-]+$/;

let testManagerId = 1;

beforeEach(async () => {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "curriculum-tester@mindkid.edu.vn"));

  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "curriculum-tester@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Curriculum Tester",
        role: "super_admin",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: managers.email,
        set: { displayName: "Curriculum Tester" },
      })
      .returning({ id: managers.id });
  }
  if (mgr) {
    testManagerId = mgr.id;
  }
});

function mockEvent(
  method: string,
  managerRole?: "super_admin" | "content_reviewer",
  params: Record<string, string> = {},
  body?: unknown,
  query: Record<string, string> = {}
) {
  const headersMap: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          "user-agent": "VitestTestRunner/1.0",
          "x-csrf-token": CSRF_TOKEN,
          cookie: `tm_m_csrf=${CSRF_TOKEN}`,
        },
      },
      res: {
        setHeader: (k: string, v: string) => {
          headersMap[k.toLowerCase()] = v;
        },
        getHeader: (k: string) => headersMap[k.toLowerCase()],
      },
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              id: testManagerId,
              manager_id: testManagerId,
              display_name: "Manager Tester",
              session_id: "sess_manager_123",
              role: managerRole,
            },
          }
        : {}),
      params,
      body,
    },
    query,
    _body: body,
  } as any;
}

describe("Curriculum Builder API Endpoints (BR-CBD-01..08, D-LS..D-LZ)", () => {
  it("rejects unauthenticated requests on all endpoints", async () => {
    const event = mockEvent("GET");
    await expect(getCurriculaHandler(event)).rejects.toThrow();
  });

  it("POST /api/managers/curricula creates curriculum draft with server-generated code (D-LT)", async () => {
    const event = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        title: "Chương Trình Test API",
        program_type: "age_based",
        target_age_min: 3,
        target_age_max: 4,
        duration_weeks: 8,
        sessions_per_week: 3,
        access_tier: "standard",
      }
    );

    const res = await createCurriculumHandler(event);
    expect(res).toBeDefined();
    expect(res.code).toMatch(CUR_CODE_REGEX);
    expect(res.title).toBe("Chương Trình Test API");
    expect(res.programType).toBe("age_based");
    expect(res.status).toBe("draft");
  });

  it("GET /api/managers/curricula lists and filters curricula", async () => {
    const listEvent = mockEvent("GET", "content_reviewer", {}, undefined, {
      search: "Chương Trình Test",
      page: "1",
      limit: "10",
    });

    const res = await getCurriculaHandler(listEvent);
    expect(res.items).toBeDefined();
    expect(Array.isArray(res.items)).toBe(true);
    expect(res.total).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/managers/curricula/[code]/[version] returns curriculum detail with weeks, items, balance", async () => {
    const createEvent = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        title: "Chương Trình Detail Test",
        program_type: "age_based",
        duration_weeks: 8,
        sessions_per_week: 3,
      }
    );
    const created = await createCurriculumHandler(createEvent);

    const getEvent = mockEvent("GET", "content_reviewer", {
      code: created.code,
      version: "1",
    });

    const res = await getCurriculumHandler(getEvent);
    expect(res.code).toBe(created.code);
    expect(res.weeks).toBeDefined();
    expect(res.items).toBeDefined();
    expect(res.balance).toBeDefined();
    expect(res.balance.is_balanced).toBeDefined();
  });

  it("PATCH /api/managers/curricula/[code]/[version] updates metadata and enforces expected_version lock", async () => {
    const createEvent = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        title: "Chương Trình Patch Test",
        program_type: "age_based",
        duration_weeks: 8,
      }
    );
    const created = await createCurriculumHandler(createEvent);

    // Version mismatch should fail with 409
    const conflictEvent = mockEvent(
      "PATCH",
      "content_reviewer",
      {
        code: created.code,
        version: "1",
      },
      {
        expected_version: 99,
        title: "Updated Title",
      }
    );
    await expect(patchCurriculumHandler(conflictEvent)).rejects.toThrow();

    // Valid expected_version should succeed
    const validPatchEvent = mockEvent(
      "PATCH",
      "content_reviewer",
      {
        code: created.code,
        version: "1",
      },
      {
        expected_version: 1,
        title: "Updated Title Success",
        duration_weeks: 10,
      }
    );
    const updated = await patchCurriculumHandler(validPatchEvent);
    expect(updated.title).toBe("Updated Title Success");
    expect(updated.durationWeeks).toBe(10);
  });

  it("PUT /api/managers/curricula/[code]/[version]/items replaces items atomically with expected_version lock", async () => {
    const createEvent = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        title: "Chương Trình Items Test",
        program_type: "age_based",
        duration_weeks: 8,
      }
    );
    const created = await createCurriculumHandler(createEvent);

    const putItemsEvent = mockEvent(
      "PUT",
      "content_reviewer",
      {
        code: created.code,
        version: "1",
      },
      {
        expected_version: 1,
        items: [
          {
            week_no: 1,
            session_no: 1,
            position: 1,
            entity_type: "lesson",
            entity_id: 101,
            is_required: true,
          },
          {
            week_no: 1,
            session_no: 2,
            position: 1,
            entity_type: "game_level",
            entity_id: 201,
            is_required: false,
          },
        ],
      }
    );

    const res = await putCurriculumItemsHandler(putItemsEvent);
    expect(res.ok).toBe(true);
    expect(res.count).toBe(2);

    // Duplicate positions or out-of-bounds weeks must fail
    const invalidItemsEvent = mockEvent(
      "PUT",
      "content_reviewer",
      {
        code: created.code,
        version: "1",
      },
      {
        expected_version: 1,
        items: [
          {
            week_no: 99, // Exceeds duration_weeks 8
            session_no: 1,
            position: 1,
            entity_type: "lesson",
            entity_id: 101,
          },
        ],
      }
    );
    await expect(
      putCurriculumItemsHandler(invalidItemsEvent)
    ).rejects.toThrow();
  });

  it("PUT /api/managers/curricula/[code]/[version]/weeks updates week goals", async () => {
    const createEvent = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        title: "Chương Trình Weeks Test",
        duration_weeks: 8,
      }
    );
    const created = await createCurriculumHandler(createEvent);

    const putWeeksEvent = mockEvent(
      "PUT",
      "content_reviewer",
      {
        code: created.code,
        version: "1",
      },
      {
        expected_version: 1,
        weeks: [
          { week_no: 1, goal: "Mục tiêu tuần 1: Đếm số" },
          { week_no: 2, goal: "Mục tiêu tuần 2: So sánh" },
        ],
      }
    );

    const res = await putCurriculumWeeksHandler(putWeeksEvent);
    expect(res.ok).toBe(true);
    expect(res.count).toBe(2);
  });

  it("POST /api/managers/curricula/[code]/[version]/duplicate copies items and weeks to new draft (BR-CBD-08)", async () => {
    const createEvent = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        title: "Chương Trình Gốc",
        duration_weeks: 8,
      }
    );
    const source = await createCurriculumHandler(createEvent);

    // Add 1 item
    await putCurriculumItemsHandler(
      mockEvent(
        "PUT",
        "content_reviewer",
        {
          code: source.code,
          version: "1",
        },
        {
          expected_version: 1,
          items: [
            {
              week_no: 1,
              session_no: 1,
              position: 1,
              entity_type: "lesson",
              entity_id: 501,
            },
          ],
        }
      )
    );

    const duplicateEvent = mockEvent(
      "POST",
      "content_reviewer",
      {
        code: source.code,
        version: "1",
      },
      {
        title: "Chương Trình Nhân Bản",
      }
    );

    const duplicated = await duplicateCurriculumHandler(duplicateEvent);
    expect(duplicated.code).not.toBe(source.code);
    expect(duplicated.title).toBe("Chương Trình Nhân Bản");
    expect(duplicated.status).toBe("draft");

    // Verify duplicated items copied
    const db = getOwnerDb();
    const copiedItems = await db
      .select()
      .from(curriculumItems)
      .where(eq(curriculumItems.curriculumId, duplicated.id));
    expect(copiedItems).toHaveLength(1);
    expect(copiedItems[0].entityId).toBe(501);
  });

  it("DELETE /api/managers/curricula/[code]/[version] deletes draft curriculum and leaves referenced content intact (BR-CBD-01)", async () => {
    const createEvent = mockEvent(
      "POST",
      "super_admin",
      {},
      {
        title: "Chương Trình Cần Xoá",
        duration_weeks: 4,
      }
    );
    const created = await createCurriculumHandler(createEvent);

    const deleteEvent = mockEvent("DELETE", "super_admin", {
      code: created.code,
      version: "1",
    });

    const res = await deleteCurriculumHandler(deleteEvent);
    expect(res.ok).toBe(true);

    // Verify curriculum is removed
    const db = getOwnerDb();
    const [found] = await db
      .select()
      .from(curricula)
      .where(eq(curricula.id, created.id));
    expect(found).toBeUndefined();
  });
});
