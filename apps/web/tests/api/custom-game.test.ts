import {
  childProfiles,
  customGames,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  users,
} from "@kidthink/db";
import { beforeEach, describe, expect, it } from "vitest";
import configHandler from "../../server/api/users/custom-games/[uuid]/config.get.js";
import deleteCustomGameHandler from "../../server/api/users/custom-games/[uuid]/index.delete.js";
import getCustomGameHandler from "../../server/api/users/custom-games/[uuid]/index.get.js";
import patchCustomGameHandler from "../../server/api/users/custom-games/[uuid]/index.patch.js";
import validateCustomGameHandler from "../../server/api/users/custom-games/[uuid]/validate.post.js";
import listCustomGamesHandler from "../../server/api/users/custom-games/index.get.js";
import createCustomGameHandler from "../../server/api/users/custom-games/index.post.js";
import { invalidateUserEntitlementsCache } from "../../server/utils/entitlements-runtime.js";

function makeUserEvent(
  userId: number,
  routerParams: Record<string, string> = {},
  body?: Record<string, unknown>,
  method?: string,
  query: Record<string, string> = {}
) {
  const resolvedMethod = method || (body ? "POST" : "GET");
  const csrfToken = "a".repeat(64);
  const responseHeaders: Record<string, string> = {};
  const queryString = new URLSearchParams(query).toString();
  const url = queryString ? `/?${queryString}` : "/";

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
        url,
        originalUrl: url,
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
        display_name: "Test User",
        email: "user@test.com",
      },
      params: routerParams,
      matchedParams: routerParams,
      body,
      query,
    },
  } as any;
}

describe("P4.5 Custom Game API Endpoints (BR-CGB-01..10)", () => {
  let userA: { id: number; email: string };
  let userB: { id: number; email: string };
  let childA: { id: number; uuid: string };

  const validGT001Input = {
    template_code: "GT-001",
    title: "Tìm quả táo đỏ",
    instruction: "Bé hãy chọn quả táo màu đỏ nhé",
    theme_id: "farm",
    age_min: 3,
    age_max: 4,
    content_pack: {
      prompt: "Quả nào màu đỏ?",
      target_item: {
        item_id: "target_apple",
        asset: { kind: "emoji", ref: "EMJ-red-apple" },
      },
      options: [
        {
          item_id: "opt_apple",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          is_correct: true,
        },
        {
          item_id: "opt_banana",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_items: true,
    },
  };

  beforeEach(async () => {
    const db = getOwnerDb();
    await db.delete(customGames);
    await db.delete(childProfiles);
    await db.delete(entitlements);
    await db.delete(users);

    // Seed entitlement key if not exists
    await db
      .insert(entitlementKeys)
      .values({
        key: "create_custom_game",
        group: "creator",
        labelVi: "Tạo trò chơi tùy chỉnh",
        descriptionVi: "Quyền tạo trò chơi tùy chỉnh từ mẫu",
        isMvp: false,
      })
      .onConflictDoNothing();

    // Create User A & User B
    const [uA] = await db
      .insert(users)
      .values({
        email: `usera-${Date.now()}-${Math.random()}@test.com`,
        displayName: "User A",
        passwordHash: "hash",
      })
      .returning();
    userA = uA;

    const [uB] = await db
      .insert(users)
      .values({
        email: `userb-${Date.now()}-${Math.random()}@test.com`,
        displayName: "User B",
        passwordHash: "hash",
      })
      .returning();
    userB = uB;

    // Grant create_custom_game entitlement to User A
    await db.insert(entitlements).values({
      userId: userA.id,
      entitlementKey: "create_custom_game",
      source: "manual_grant",
      status: "active",
    });

    invalidateUserEntitlementsCache(userA.id);
    invalidateUserEntitlementsCache(userB.id);

    // Create Child for User A
    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId: userA.id,
        displayName: "Bé Bông",
        birthYear: 2022,
        avatarId: "avatar_1",
        status: "active",
      })
      .returning();
    childA = cA;
  });

  it("Scenario: unentitled user receives 403 ENTITLEMENT_REQUIRED when creating custom game", async () => {
    const event = makeUserEvent(userB.id, {}, validGT001Input, "POST");
    await expect(createCustomGameHandler(event)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("Scenario: entitled user can create custom game and mark ready", async () => {
    const event = makeUserEvent(
      userA.id,
      {},
      { ...validGT001Input, status: "ready" },
      "POST"
    );
    const response = (await createCustomGameHandler(event)) as any;
    expect(response.id).toBeDefined();
    expect(response.status).toBe("ready");
  });

  it("Scenario: list endpoint returns only caller's custom games", async () => {
    // User A creates 1 game
    const createEvent = makeUserEvent(userA.id, {}, validGT001Input, "POST");
    await createCustomGameHandler(createEvent);

    // List as User A
    const listEventA = makeUserEvent(userA.id, {}, undefined, "GET");
    const listA = (await listCustomGamesHandler(listEventA)) as any;
    expect(listA.total).toBe(1);
    expect(listA.items).toHaveLength(1);

    // List as User B
    const listEventB = makeUserEvent(userB.id, {}, undefined, "GET");
    const listB = (await listCustomGamesHandler(listEventB)) as any;
    expect(listB.total).toBe(0);
    expect(listB.items).toHaveLength(0);
  });

  it("Scenario: BR-CGB-01 & BR-ERR-05 — IDOR returns 404 NOT_FOUND for another user's game", async () => {
    const createEvent = makeUserEvent(userA.id, {}, validGT001Input, "POST");
    const created = (await createCustomGameHandler(createEvent)) as any;

    // User A can fetch
    const getEventA = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      undefined,
      "GET"
    );
    const getResA = (await getCustomGameHandler(getEventA)) as any;
    expect(getResA.uuid).toBe(created.uuid);

    // User B receives 404 NOT_FOUND
    const getEventB = makeUserEvent(
      userB.id,
      { uuid: created.uuid },
      undefined,
      "GET"
    );
    await expect(getCustomGameHandler(getEventB)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("Scenario: PATCH updates game with versioning", async () => {
    const createEvent = makeUserEvent(userA.id, {}, validGT001Input, "POST");
    const created = (await createCustomGameHandler(createEvent)) as any;

    const patchEvent = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      { title: "Tiêu đề đã sửa", expected_version: 1 },
      "PATCH"
    );
    const updated = (await patchCustomGameHandler(patchEvent)) as any;
    expect(updated.title).toBe("Tiêu đề đã sửa");
    expect(updated.version).toBe(2);
  });

  it("Scenario: POST validate endpoint returns validation issues", async () => {
    const createEvent = makeUserEvent(
      userA.id,
      {},
      { ...validGT001Input, instruction: "Bé đừng chọn quả chuối" },
      "POST"
    );
    const created = (await createCustomGameHandler(createEvent)) as any;

    const valEvent = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      {},
      "POST"
    );
    const valRes = (await validateCustomGameHandler(valEvent)) as any;
    expect(valRes.ok).toBe(false);
    expect(valRes.missing).toContain("content_moderation_failed");
  });

  it("Scenario: GET config endpoint returns play config for child", async () => {
    const createEvent = makeUserEvent(
      userA.id,
      {},
      { ...validGT001Input, status: "ready" },
      "POST"
    );
    const created = (await createCustomGameHandler(createEvent)) as any;

    const configEvent = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      undefined,
      "GET",
      { child_uuid: childA.uuid }
    );
    const config = (await configHandler(configEvent)) as any;
    expect(config.game_type).toBe("GT-001");
    expect(config.source_kind).toBe("custom_game");
    expect(config.source_ref_uuid).toBe(created.uuid);
    expect(config.child_uuid).toBe(childA.uuid);
  });

  it("Scenario: DELETE removes custom game", async () => {
    const createEvent = makeUserEvent(userA.id, {}, validGT001Input, "POST");
    const created = (await createCustomGameHandler(createEvent)) as any;

    const deleteEvent = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      undefined,
      "DELETE"
    );
    const delRes = (await deleteCustomGameHandler(deleteEvent)) as any;
    expect(delRes.deleted).toBe(true);

    const getEvent = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      undefined,
      "GET"
    );
    await expect(getCustomGameHandler(getEvent)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
