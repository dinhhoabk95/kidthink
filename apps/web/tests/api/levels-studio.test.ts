import { getOwnerDb, managers } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import duplicateLevelHandler from "../../server/api/managers/levels/[code]/[version]/duplicate.post.js";
import getLevelVersionHandler from "../../server/api/managers/levels/[code]/[version].get.js";
import patchLevelHandler from "../../server/api/managers/levels/[code]/[version].patch.js";
import createLevelHandler from "../../server/api/managers/levels/index.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const LEVEL_CODE_REGEX = /^GL-C1-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$/;
let testManagerId = 1;

beforeAll(async () => {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "studio-tester@kidthink.edu.vn"));
  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "studio-tester@kidthink.edu.vn",
        passwordHash: "hash",
        displayName: "Studio Tester",
        role: "super_admin",
        isActive: true,
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
  body?: unknown
) {
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
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: testManagerId,
              display_name: "Manager Tester",
              session_id: "sess_manager_123",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
      params,
      body,
    },
    _body: body,
  } as any;
}

describe("Game Level Studio & Management API (BR-STU-01 - BR-STU-09, Spec §7.2)", () => {
  it("rejects unauthenticated requests", async () => {
    const event = mockEvent("POST", undefined, {}, { template_code: "GT-001" });
    await expect(createLevelHandler(event)).rejects.toThrow();
  });

  it("POST /api/managers/levels creates draft level with valid code format (BR-STU-04)", async () => {
    const event = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title_vi: "Đếm số bông hoa",
        instruction_vi: "Hãy đếm số bông hoa xuất hiện",
        content_pack: {
          prompt: "Có bao nhiêu bông hoa?",
          target_number: 3,
          item_emoji: "🌸",
          options: [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
          ],
        },
      }
    );

    const res = (await createLevelHandler(event)) as any;
    expect(res).toBeDefined();
    expect(res.id).toBeDefined();
    expect(res.code).toMatch(LEVEL_CODE_REGEX);
    expect(res.contentVersion).toBe(1);
    expect(res.status).toBe("draft");
    expect(res.titleVi).toBe("Đếm số bông hoa");
  });

  it("GET /api/managers/levels/[code]/[version] retrieves level details", async () => {
    // 1. Create a level first
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-002",
        title_vi: "Tìm số còn thiếu",
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    // 2. Fetch by code and version
    const getEvt = mockEvent("GET", "content_reviewer", {
      code: created.code,
      version: "1",
    });
    const fetched = (await getLevelVersionHandler(getEvt)) as any;

    expect(fetched.code).toBe(created.code);
    expect(fetched.contentVersion).toBe(1);
    expect(fetched.titleVi).toBe("Tìm số còn thiếu");
  });

  it("PATCH /api/managers/levels/[code]/[version] updates draft and enforces optimistic concurrency (BR-STU-03)", async () => {
    // 1. Create level
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title_vi: "Tiêu đề cũ",
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    // 2. Update with matching expected_version
    const patchEvt = mockEvent(
      "PATCH",
      "content_reviewer",
      { code: created.code, version: "1" },
      {
        title_vi: "Tiêu đề mới",
        expected_version: 1,
      }
    );
    const updated = (await patchLevelHandler(patchEvt)) as any;
    expect(updated.titleVi).toBe("Tiêu đề mới");

    // 3. Update with mismatched expected_version -> 409 VERSION_CONFLICT
    const conflictEvt = mockEvent(
      "PATCH",
      "content_reviewer",
      { code: created.code, version: "1" },
      {
        title_vi: "Sẽ bị xung đột",
        expected_version: 99,
      }
    );

    try {
      await patchLevelHandler(conflictEvt);
      expect.fail("Should have thrown 409 VERSION_CONFLICT");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(409);
    }
  });

  it("POST /api/managers/levels/[code]/[version]/duplicate creates cloned draft level (D-KA)", async () => {
    // 1. Create level
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title_vi: "Bản gốc",
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    // 2. Duplicate
    const dupEvt = mockEvent("POST", "content_reviewer", {
      code: created.code,
      version: "1",
    });
    const cloned = (await duplicateLevelHandler(dupEvt)) as any;

    expect(cloned.code).not.toBe(created.code);
    expect(cloned.contentVersion).toBe(1);
    expect(cloned.status).toBe("draft");
    expect(cloned.titleVi).toContain("Bản gốc");
  });
});
