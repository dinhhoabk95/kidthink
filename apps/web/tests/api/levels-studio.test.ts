import { getOwnerDb, managers } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import duplicateLevelHandler from "../../server/api/managers/levels/[code]/[version]/duplicate.post.js";
import submitLevelHandler from "../../server/api/managers/levels/[code]/[version]/submit.post.js";
import getLevelVersionHandler from "../../server/api/managers/levels/[code]/[version].get.js";
import patchLevelHandler from "../../server/api/managers/levels/[code]/[version].patch.js";
import getLevelConfigHandler from "../../server/api/managers/levels/[code]/config.get.js";
import createLevelHandler from "../../server/api/managers/levels/index.post.js";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const LEVEL_CODE_REGEX = /^GL-C1-[A-Z]{2,5}-[A-Z]{2,5}-\d{4}$/;
let testManagerId = 1;

beforeEach(async () => {
  const db = getOwnerDb();
  let [mgr] = await db
    .select({ id: managers.id })
    .from(managers)
    .where(eq(managers.email, "studio-tester@mindkid.edu.vn"));
  if (!mgr) {
    [mgr] = await db
      .insert(managers)
      .values({
        email: "studio-tester@mindkid.edu.vn",
        passwordHash: "hash",
        displayName: "Studio Tester",
        role: "super_admin",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: managers.email,
        set: { displayName: "Studio Tester" },
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

describe("Game Level Studio & Management API (BR-STU-01 - BR-STU-10, Spec §7.2)", () => {
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
        title: "Đếm số bông hoa",
        instruction: "Hãy đếm số bông hoa xuất hiện",
        access_tier: "free",
        content_pack: {
          prompt: "Tìm quả táo màu đỏ",
          target_item: {
            item_id: "apple_target",
            asset: { kind: "emoji", ref: "🍎" },
          },
          options: [
            {
              item_id: "apple_opt",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: true,
            },
            {
              item_id: "banana_opt",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: false,
            },
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
    expect(res.title).toBe("Đếm số bông hoa");
  });

  it("GET /api/managers/levels/[code]/[version] retrieves level details", async () => {
    // 1. Create a level first
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-002",
        title: "Tìm số còn thiếu",
        access_tier: "free",
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
    expect(fetched.title).toBe("Tìm số còn thiếu");
  });

  it("PATCH /api/managers/levels/[code]/[version] updates draft and enforces optimistic concurrency (BR-STU-03)", async () => {
    // 1. Create level
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title: "Tiêu đề cũ",
        access_tier: "free",
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    // 2. Update with matching expected_version
    const patchEvt = mockEvent(
      "PATCH",
      "content_reviewer",
      { code: created.code, version: "1" },
      {
        title: "Tiêu đề mới",
        expected_version: 1,
      }
    );
    const updated = (await patchLevelHandler(patchEvt)) as any;
    expect(updated.title).toBe("Tiêu đề mới");

    // 3. Update with mismatched expected_version -> 409 VERSION_CONFLICT
    const conflictEvt = mockEvent(
      "PATCH",
      "content_reviewer",
      { code: created.code, version: "1" },
      {
        title: "Sẽ bị xung đột",
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

  it("PATCH /api/managers/levels/[code]/[version] rejects invalid content_pack with 422 (BR-STU-02)", async () => {
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title: "Level test validation",
        access_tier: "free",
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    const invalidPatchEvt = mockEvent(
      "PATCH",
      "content_reviewer",
      { code: created.code, version: "1" },
      {
        content_pack: {
          prompt: "", // invalid empty prompt
          target_number: -999,
          options: "not-an-array",
        },
      }
    );

    try {
      await patchLevelHandler(invalidPatchEvt);
      expect.fail("Should have thrown 422 CONTENT_PACK_INVALID");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(422);
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
        title: "Bản gốc",
        access_tier: "free",
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
    expect(cloned.title).toContain("Bản gốc");
  });

  it("POST /api/managers/levels/[code]/[version]/submit transitions draft to in_review (BR-STU-07)", async () => {
    // 1. Create level with valid content pack & access tier
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title: "Bài học hoàn chỉnh",
        instruction: "Đếm số bông hoa",
        access_tier: "standard",
        content_pack: {
          prompt: "Đếm hoa",
          hasCorrectAnswer: true,
          correctAnswers: ["3"],
          items: [{ isCorrect: true, emoji: "🌸" }],
        },
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    // 2. Submit for review
    const submitEvt = mockEvent("POST", "content_reviewer", {
      code: created.code,
      version: "1",
    });
    const result = (await submitLevelHandler(submitEvt)) as any;
    expect(result.status).toBe("in_review");
  });

  it("GET /api/managers/levels/[code]/config delivers preview config without gating (D-JW, D-JX, BR-LPV-05)", async () => {
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title: "Level Preview Config",
        access_tier: "premium",
        content_pack: {
          prompt: "Tìm quả táo màu đỏ",
          target_item: {
            item_id: "apple_target",
            asset: { kind: "emoji", ref: "🍎" },
          },
          options: [
            {
              item_id: "apple_opt",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: true,
            },
            {
              item_id: "banana_opt",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: false,
            },
          ],
        },
      }
    );
    const created = (await createLevelHandler(createEvt)) as any;

    const configEvt = mockEvent(
      "GET",
      "content_reviewer",
      { code: created.code },
      undefined,
      { version: "1" }
    );
    const config = (await getLevelConfigHandler(configEvt)) as any;
    expect(config).toBeDefined();
    expect(config.level_code).toBe(created.code);
    expect(config.content_version).toBe(1);
  });

  it("Task #92 — POST /api/managers/levels rejects invalid layout_id with 422 LAYOUT_NOT_SUPPORTED (BR-LAY-02, BR-LAY-10)", async () => {
    const createEvt = mockEvent(
      "POST",
      "content_reviewer",
      {},
      {
        template_code: "GT-001",
        title: "Level with Invalid Layout",
        access_tier: "free",
        difficulty_params: {
          layout_id: "step-ladder", // GT-001 does not support step-ladder
        },
        content_pack: {
          prompt: "Tìm quả táo",
          target_item: { item_id: "t1", asset: { kind: "emoji", ref: "🍎" } },
          options: [
            {
              item_id: "o1",
              asset: { kind: "emoji", ref: "🍎" },
              is_correct: true,
            },
            {
              item_id: "o2",
              asset: { kind: "emoji", ref: "🍌" },
              is_correct: false,
            },
          ],
        },
      }
    );

    await expect(createLevelHandler(createEvt)).rejects.toMatchObject({
      statusCode: 422,
      statusMessage: "LAYOUT_NOT_SUPPORTED",
    });
  });
});
