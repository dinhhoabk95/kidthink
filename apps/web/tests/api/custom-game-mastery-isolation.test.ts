import {
  childProfiles,
  entitlementKeys,
  entitlements,
  getOwnerDb,
  masteryState,
  users,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import configHandler from "../../server/api/users/custom-games/[uuid]/config.get.js";
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
        display_name: "Parent User",
        email: "parent@test.com",
      },
      params: routerParams,
      matchedParams: routerParams,
      body,
      query,
    },
  } as any;
}

describe("P4.5 Custom Game Mastery Isolation (BR-CGB-06)", () => {
  let userA: { id: number; email: string };
  let childA: { id: number; uuid: string };

  afterEach(async () => {
    const db = getOwnerDb();
    if (userA?.id) {
      await db.delete(users).where(eq(users.id, userA.id));
    }
  });

  beforeEach(async () => {
    const db = getOwnerDb();

    await db
      .insert(entitlementKeys)
      .values({
        key: "create_custom_game",
        group: "creator",
        labelVi: "Tạo trò chơi tùy chỉnh",
        descriptionVi: "Quyền tạo trò chơi tùy chỉnh",
        isMvp: false,
      })
      .onConflictDoNothing();

    const [uA] = await db
      .insert(users)
      .values({
        email: `parent-${Date.now()}@test.com`,
        displayName: "Parent User",
        passwordHash: "hash",
      })
      .returning();
    userA = uA;

    await db.insert(entitlements).values({
      userId: userA.id,
      entitlementKey: "create_custom_game",
      source: "manual_grant",
      status: "active",
    });
    invalidateUserEntitlementsCache(userA.id);

    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId: userA.id,
        displayName: "Bé An",
        birthYear: 2022,
        avatarId: "cat",
        status: "active",
      })
      .returning();
    childA = cA;
  });

  it("Scenario: BR-CGB-06 — custom game returns source_kind 'custom_game' and leaves mastery_state unpolluted", async () => {
    const db = getOwnerDb();

    // 1. Create and ready custom game
    const createEv = makeUserEvent(
      userA.id,
      {},
      {
        template_code: "GT-001",
        title: "Trò chơi học số của mẹ",
        instruction: "Bé tìm số 1 nhé",
        theme_id: "farm",
        age_min: 3,
        age_max: 4,
        status: "ready",
        content_pack: {
          prompt: "Đâu là quả táo?",
          target_item: {
            item_id: "apple_target",
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
      },
      "POST"
    );
    const created = (await createCustomGameHandler(createEv)) as any;

    // 2. Fetch play config for child
    const configEv = makeUserEvent(
      userA.id,
      { uuid: created.uuid },
      undefined,
      "GET",
      { child_uuid: childA.uuid }
    );
    const config = (await configHandler(configEv)) as any;

    // Assert play metadata specifies source_kind as custom_game
    expect(config.source_kind).toBe("custom_game");
    expect(config.source_ref_uuid).toBe(created.uuid);
    expect(config.child_uuid).toBe(childA.uuid);

    // 3. Verify mastery_state remains empty (0 rows)
    const masteryRows = await db.select().from(masteryState);
    expect(masteryRows).toHaveLength(0);
  });
});
