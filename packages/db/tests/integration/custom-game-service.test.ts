import { beforeEach, describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/client.ts";
import { childProfiles } from "../../src/schema/child.ts";
import { customGames } from "../../src/schema/custom-game.ts";
import { users } from "../../src/schema/identity.ts";
import {
  createCustomGame,
  DEFAULT_CUSTOM_GAMES_SAVED_QUOTA,
  deleteCustomGame,
  getCustomGameByUuid,
  getCustomGamePlayConfig,
  listCustomGames,
  updateCustomGame,
  validateCustomGameRecord,
} from "../../src/services/custom-game.ts";

describe("P4.5 Custom Game DB Service (BR-CGB-01..10)", () => {
  let userA: { id: number; email: string };
  let userB: { id: number; email: string };
  let childA: { id: number; uuid: string };

  const validGT001Input = {
    template_code: "GT-001" as const,
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
    await db.delete(users);

    // Create User A & User B
    const [uA] = await db
      .insert(users)
      .values({
        email: `usera-${Date.now()}-${Math.random()}@example.com`,
        displayName: "User A",
        passwordHash: "dummy-hash",
      })
      .returning();
    userA = uA;

    const [uB] = await db
      .insert(users)
      .values({
        email: `userb-${Date.now()}-${Math.random()}@example.com`,
        displayName: "User B",
        passwordHash: "dummy-hash",
      })
      .returning();
    userB = uB;

    // Create child profile for User A
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

  it("Scenario: BR-CGB-01 & BR-CGB-05 — creates draft and ready custom games with validation", async () => {
    // 1. Create draft game
    const draftGame = await createCustomGame(userA.id, {
      ...validGT001Input,
      status: "draft",
    });
    expect(draftGame.id).toBeDefined();
    expect(draftGame.status).toBe("draft");
    expect(draftGame.version).toBe(1);

    // 2. Create ready game
    const readyGame = await createCustomGame(userA.id, {
      ...validGT001Input,
      status: "ready",
    });
    expect(readyGame.status).toBe("ready");

    // 3. Fails when creating ready game with invalid content
    await expect(
      createCustomGame(userA.id, {
        ...validGT001Input,
        title: "Trò chơi bắn súng bạo lực",
        status: "ready",
      })
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("Scenario: BR-CGB-08 — enforces quota of max 10 saved custom games (402 QUOTA_EXCEEDED)", async () => {
    for (let i = 0; i < DEFAULT_CUSTOM_GAMES_SAVED_QUOTA; i++) {
      await createCustomGame(userA.id, {
        ...validGT001Input,
        title: `Game ${i + 1}`,
      });
    }

    // 11th creation should fail with QUOTA_EXCEEDED
    await expect(
      createCustomGame(userA.id, {
        ...validGT001Input,
        title: "Game 11",
      })
    ).rejects.toMatchObject({
      code: "QUOTA_EXCEEDED",
    });
  });

  it("Scenario: BR-CGB-01 & BR-ERR-05 — 404 NOT_FOUND when accessing game of another user", async () => {
    const gameA = await createCustomGame(userA.id, validGT001Input);

    // User A can read
    const fetched = await getCustomGameByUuid(userA.id, gameA.uuid);
    expect(fetched.id).toBe(gameA.id);

    // User B cannot read User A's game -> 404 NOT_FOUND
    await expect(
      getCustomGameByUuid(userB.id, gameA.uuid)
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("Scenario: listCustomGames returns only caller's games with quota count", async () => {
    await createCustomGame(userA.id, { ...validGT001Input, title: "Game A1" });
    await createCustomGame(userA.id, { ...validGT001Input, title: "Game A2" });
    await createCustomGame(userB.id, { ...validGT001Input, title: "Game B1" });

    const listA = await listCustomGames(userA.id);
    expect(listA.total).toBe(2);
    expect(listA.quota.current).toBe(2);
    expect(listA.quota.limit).toBe(10);
    expect(listA.items.every((g) => g.userId === userA.id)).toBe(true);
  });

  it("Scenario: updateCustomGame supports optimistic locking and validation before ready", async () => {
    const game = await createCustomGame(userA.id, {
      ...validGT001Input,
      status: "draft",
    });

    // 1. Successful update
    const updated = await updateCustomGame(userA.id, game.uuid, {
      title: "Tiêu đề mới",
      expected_version: 1,
    });
    expect(updated.title).toBe("Tiêu đề mới");
    expect(updated.version).toBe(2);

    // 2. Version conflict when expected_version is wrong
    await expect(
      updateCustomGame(userA.id, game.uuid, {
        title: "Conflict",
        expected_version: 1, // Current is 2
      })
    ).rejects.toMatchObject({
      code: "VERSION_CONFLICT",
    });

    // 3. Mark ready with validation
    const ready = await updateCustomGame(userA.id, game.uuid, {
      status: "ready",
      expected_version: 2,
    });
    expect(ready.status).toBe("ready");
  });

  it("Scenario: deleteCustomGame removes game and frees slot", async () => {
    const game = await createCustomGame(userA.id, validGT001Input);
    const delRes = await deleteCustomGame(userA.id, game.uuid);
    expect(delRes.deleted).toBe(true);

    // Now 404
    await expect(
      getCustomGameByUuid(userA.id, game.uuid)
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    // Quota freed
    const list = await listCustomGames(userA.id);
    expect(list.total).toBe(0);
  });

  it("Scenario: validateCustomGameRecord returns issues for existing record", async () => {
    const game = await createCustomGame(userA.id, {
      ...validGT001Input,
      instruction: "Đừng chọn quả màu vàng",
      status: "draft",
    });

    const report = await validateCustomGameRecord(userA.id, game.uuid);
    expect(report.ok).toBe(false);
    expect(report.missing).toContain("content_moderation_failed");
  });

  it("Scenario: BR-CGB-01 & BR-CGB-06 — getCustomGamePlayConfig verifies child ownership and readiness", async () => {
    // 1. Ready game with own child works
    const readyGame = await createCustomGame(userA.id, {
      ...validGT001Input,
      status: "ready",
    });

    const config = await getCustomGamePlayConfig(
      userA.id,
      childA.uuid,
      readyGame.uuid
    );
    expect(config.game_type).toBe("GT-001");
    expect(config.source_kind).toBe("custom_game");
    expect(config.source_ref_uuid).toBe(readyGame.uuid);
    expect(config.child_uuid).toBe(childA.uuid);

    // 2. Draft game throws VALIDATION_FAILED
    const draftGame = await createCustomGame(userA.id, {
      ...validGT001Input,
      status: "draft",
    });
    await expect(
      getCustomGamePlayConfig(userA.id, childA.uuid, draftGame.uuid)
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });

    // 3. User B cannot play User A's game or with User A's child -> 404 NOT_FOUND
    await expect(
      getCustomGamePlayConfig(userB.id, childA.uuid, readyGame.uuid)
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
