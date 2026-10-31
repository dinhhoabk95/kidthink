import { gameLevelRounds, gameLevels, getOwnerDb } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { seedContentTags } from "#src/seed-master/content-tags";
import { seedTaxonomyMasterData } from "#src/seed-master/taxonomy/index";
import { executeSeedBatch } from "#src/service";
import type { ContentSeed } from "#src/types";

describe("Game Schema Integration Tests", () => {
  async function getUniqueGameLevelCode(prefix = "GL-C1-NUM-DRAG") {
    const db = getOwnerDb();
    while (true) {
      const code = `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
      const [existing] = await db
        .select({ id: gameLevels.id })
        .from(gameLevels)
        .where(eq(gameLevels.code, code))
        .limit(1);
      if (!existing) {
        return code;
      }
    }
  }

  it("access_tier has no default and rejects omitted value", async () => {
    const db = getOwnerDb();
    const code = await getUniqueGameLevelCode();

    // Inserting gameLevel without access_tier must fail NOT NULL constraint
    await expect(
      // @ts-expect-error testing missing access_tier
      db.insert(gameLevels).values({
        code,
        templateCode: "GT-001",
        title: "Level Test",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
      })
    ).rejects.toThrow();
  });

  it("BR-SCT-03: unique constraint enforces only one row per code", async () => {
    const db = getOwnerDb();
    const code = await getUniqueGameLevelCode();

    // 1. Insert first row
    const [gl1] = await db
      .insert(gameLevels)
      .values({
        code,
        templateCode: "GT-001",
        title: "Level V1",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
      })
      .returning();

    expect(gl1).toBeDefined();

    // 2. Insert second row with SAME code -> must fail unique constraint
    await expect(
      db.insert(gameLevels).values({
        code,
        templateCode: "GT-001",
        title: "Level V2",
        contentPack: { test: true },
        difficultyParams: { speed: 2 },
        accessTier: "free",
      })
    ).rejects.toThrow();
  });

  it("allows UPDATE on game_levels row directly", async () => {
    const db = getOwnerDb();
    const code = await getUniqueGameLevelCode();

    const [gl] = await db
      .insert(gameLevels)
      .values({
        code,
        templateCode: "GT-001",
        title: "Original Title",
        contentPack: { test: true },
        difficultyParams: { speed: 1 },
        accessTier: "free",
      })
      .returning();
    if (!gl) {
      throw new Error("Failed to insert gl");
    }

    expect(gl).toBeDefined();

    const [updated] = await db
      .update(gameLevels)
      .set({ title: "Modified Title" })
      .where(eq(gameLevels.id, gl.id))
      .returning();
    expect(updated?.title).toBe("Modified Title");
  });

  it("WP167.6: ContentSeed with rounds creates rows in game_level_rounds", async () => {
    const db = getOwnerDb();
    await seedTaxonomyMasterData(db);
    await seedContentTags(db);

    const gtCode = "GT-001";

    const validGt001Content = {
      prompt: "Tìm quả táo",
      target_item: {
        item_id: "apple",
        asset: { kind: "emoji" as const, ref: "🍎" },
      },
      options: [
        {
          item_id: "apple",
          asset: { kind: "emoji" as const, ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "banana",
          asset: { kind: "emoji" as const, ref: "🍌" },
          is_correct: false,
        },
      ],
    };
    const validGt001Diff = {
      distractor_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    };

    const codeMulti = await getUniqueGameLevelCode("GL-C3-SET-APP");
    const seedWithRounds: ContentSeed = {
      kind: "game_level",
      header: {
        code: codeMulti,
        content_version: 1,
        template_code: gtCode,
        title: "Multi Round Level",
        instruction: "Chơi 4 vòng",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free",
        skill_codes: ["C3.SET.01"],
        learning_objective_codes: ["LO-C3.SET.01-01"],
        what_tags: ["category"],
        thinking_tags: ["sort"],
        origin: "human",
        authored_in: "studio",
      },
      content_pack: validGt001Content,
      difficulty_params: validGt001Diff,
      rounds: [
        {
          instruction: "Vòng 0",
          content_pack: validGt001Content,
          difficulty_params: validGt001Diff,
          difficulty: 1,
        },
        {
          instruction: "Vòng 1",
          content_pack: validGt001Content,
          difficulty_params: validGt001Diff,
          difficulty: 1,
        },
        {
          instruction: "Vòng 2",
          content_pack: validGt001Content,
          difficulty_params: validGt001Diff,
          difficulty: 2,
        },
        {
          instruction: "Vòng 3",
          content_pack: validGt001Content,
          difficulty_params: validGt001Diff,
          difficulty: 2,
        },
      ],
    };

    const codeSingle = await getUniqueGameLevelCode("GL-C3-SET-APP");
    const seedWithoutRounds: ContentSeed = {
      kind: "game_level",
      header: {
        code: codeSingle,
        content_version: 1,
        template_code: gtCode,
        title: "Single Round Default Level",
        instruction: "Chơi 1 vòng mặc định",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free",
        skill_codes: ["C3.SET.01"],
        learning_objective_codes: ["LO-C3.SET.01-01"],
        what_tags: ["category"],
        thinking_tags: ["sort"],
        origin: "human",
        authored_in: "studio",
      },
      content_pack: validGt001Content,
      difficulty_params: validGt001Diff,
    };

    const batchRes = await executeSeedBatch(db, {
      batchCode: `TEST-ROUNDS-${Date.now()}`,
      seeds: [seedWithRounds, seedWithoutRounds],
    });

    expect(batchRes.rowsInserted).toBe(2);

    // 1. Verify multi-round level has 4 rows
    const [levelMulti] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.code, codeMulti));
    expect(levelMulti).toBeDefined();
    if (!levelMulti) {
      throw new Error("levelMulti not found");
    }

    const roundsMulti = await db
      .select()
      .from(gameLevelRounds)
      .where(eq(gameLevelRounds.gameLevelId, levelMulti.id));
    expect(roundsMulti).toHaveLength(4);
    expect(roundsMulti.map((r) => r.roundIndex).sort()).toEqual([0, 1, 2, 3]);

    // 2. Verify single-round level has 1 row with round_index = 0
    const [levelSingle] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.code, codeSingle));
    expect(levelSingle).toBeDefined();
    if (!levelSingle) {
      throw new Error("levelSingle not found");
    }

    const roundsSingle = await db
      .select()
      .from(gameLevelRounds)
      .where(eq(gameLevelRounds.gameLevelId, levelSingle.id));
    expect(roundsSingle).toHaveLength(1);
    expect(roundsSingle[0]?.roundIndex).toBe(0);
  });
});
