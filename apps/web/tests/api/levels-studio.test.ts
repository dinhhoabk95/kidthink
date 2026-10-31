import { gameLevels, getOwnerDb, managers } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import getLevelConfigHandler from "#server/api/managers/levels/[code]/config.get";
import getLevelsHandler from "#server/api/managers/levels/index.get";

const CSRF_TOKEN =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

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
  body?: Record<string, string>,
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
        body,
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
    _requestBody: body,
    _body: body,
  };
}

describe("Game Level Read-Only Management API", () => {
  it("rejects unauthenticated requests", async () => {
    const event = mockEvent("GET", undefined);
    await expect(
      getLevelsHandler(event as Parameters<typeof getLevelsHandler>[0])
    ).rejects.toThrow();
  });

  it("GET /api/managers/levels/[code]/config delivers preview config without gating (D-JW, D-JX, BR-LPV-05)", async () => {
    const db = getOwnerDb();
    const code = `GL-C1-TST-CFG-${String(Date.now()).slice(-4)}`;
    await db
      .insert(gameLevels)
      .values({
        code,
        templateCode: "GT-001",
        title: "Level Preview Config",
        instruction: "Tìm quả táo màu đỏ",
        ageMin: 3,
        ageMax: 4,
        difficulty: 1,
        accessTier: "premium",
        contentPack: {
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
        difficultyParams: {},
      })
      .onConflictDoNothing();

    const configEvt = mockEvent(
      "GET",
      "content_reviewer",
      { code },
      undefined,
      { version: "1" }
    );
    const config = await getLevelConfigHandler(
      configEvt as Parameters<typeof getLevelConfigHandler>[0]
    );
    expect(config).toBeDefined();
    expect(config.level_code).toBe(code);
    expect(config.content_version).toBe(1);
  });
});
