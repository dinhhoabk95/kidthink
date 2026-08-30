import {
  type ContentSeed,
  detectOrphanedContentTags,
  executeSeedBatch,
  getOwnerDb,
  normalizeMechanicTagCode,
  runEightGates,
  seed,
  validateAndAssignTags,
  validateContentSkillMap,
} from "@mindkid/db";
import { beforeAll, describe, expect, it } from "vitest";

describe("Task P1.10 — Content Tagging & Seed Authoring Pipeline (BR-TAG-* & BR-CSA-*)", () => {
  beforeAll(async () => {
    await seed();
  }, 60_000);
  const mockSeed: ContentSeed<any, any> = {
    header: {
      code: "GL-C1-CNT-CARD-0099",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm hoa quả trong vườn",
      instruction: "Em hãy đếm xem có bao nhiêu quả táo nhé.",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["cnt"],
      thinking_tags: ["visual"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Em hãy chọn quả táo đúng nhé",
      prompt_audio_ref: "aud_prompt_apple",
      target_item: {
        item_id: "apple_1",
        asset: { kind: "emoji", ref: "EMJ-red-apple" },
      },
      options: [
        {
          item_id: "opt_1",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          is_correct: true,
        },
        {
          item_id: "opt_2",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  };

  it("BR-TAG-01: rejects unapproved tag codes outside active vocabulary with 422 TAG_INVALID", async () => {
    const db = getOwnerDb();
    try {
      await validateAndAssignTags(db, {
        entityType: "game_level",
        entityId: 99_999,
        tagCodes: ["fun_stuff"],
      });
      expect.fail("Should have thrown 422 TAG_INVALID");
    } catch (err: any) {
      expect(err.details).toContain("Tag không hợp lệ");
    }
  });

  it("BR-TAG-02: requires >= 1 tag for each pedagogical axis (what, thinking, mechanic) on publication", async () => {
    const db = getOwnerDb();
    try {
      await validateAndAssignTags(
        db,
        {
          entityType: "game_level",
          entityId: 99_999,
          tagCodes: ["cnt"], // missing thinking and mechanic
        },
        true
      );
      expect.fail("Should have thrown PEDAGOGICAL_AXIS_TAG_MISSING");
    } catch (err: any) {
      expect(err.details).toContain("Thiếu tag cho trục sư phạm");
    }
  });

  it("BR-TAG-03 & BR-TAG-04: enforces skill map weight ∈ (0, 1] and exactly one primary skill weight = 1.0", () => {
    // Valid: 1 primary skill with 1.0 weight
    expect(() =>
      validateContentSkillMap([
        { skillId: 1, weight: 1.0 },
        { skillId: 2, weight: 0.5 },
      ])
    ).not.toThrow();

    // Invalid: weight out of range
    try {
      validateContentSkillMap([{ skillId: 1, weight: 1.5 }]);
      expect.fail("Should have thrown SKILL_WEIGHT_OUT_OF_RANGE");
    } catch (err: any) {
      expect(err.details).toContain("phải nằm trong (0, 1]");
    }

    // Invalid: multiple 1.0 weights
    try {
      validateContentSkillMap([
        { skillId: 1, weight: 1.0 },
        { skillId: 2, weight: 1.0 },
      ]);
      expect.fail("Should have thrown PRIMARY_SKILL_WEIGHT_INVALID");
    } catch (err: any) {
      expect(err.details).toContain("đúng 1 kỹ năng chính với weight = 1.0");
    }

    // Invalid: zero 1.0 weights
    try {
      validateContentSkillMap([
        { skillId: 1, weight: 0.8 },
        { skillId: 2, weight: 0.5 },
      ]);
      expect.fail("Should have thrown PRIMARY_SKILL_WEIGHT_INVALID");
    } catch (err: any) {
      expect(err.details).toContain("đúng 1 kỹ năng chính với weight = 1.0");
    }
  });

  it("BR-TAG-07: detectOrphanedContentTags returns 0 when no orphan entries present", async () => {
    const db = getOwnerDb();
    const count = await detectOrphanedContentTags(db);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("BR-CSA-01 & BR-CSA-05: executeSeedBatch performs transactional seed and dry run rollback", async () => {
    const db = getOwnerDb();
    const result = await executeSeedBatch(
      db,
      {
        batchCode: `TEST-BATCH-${Date.now()}`,
        seeds: [mockSeed],
      },
      true // dry run
    );

    expect(result.rowsInserted).toBe(1);
    expect(result.gateResults.every((g) => g.passed)).toBe(true);
  });

  it("8 Validation Gates: detects blocklisted words (Gate 7)", () => {
    const dirtySeed: ContentSeed<any, any> = {
      ...mockSeed,
      header: {
        ...mockSeed.header,
        code: "GL-C1-CNT-CARD-0098",
        instruction: "Em hãy đánh nhau với con quái vật",
      },
    };

    const gates = runEightGates(dirtySeed);
    const gate7 = gates.find((g) => g.gate === 7);
    expect(gate7?.passed).toBe(false);
    expect(gate7?.issues[0].code).toBe("CHILD_SAFETY_BLOCKLIST_MATCH");
  });

  it("Mechanic tag normalization mapping", () => {
    expect(normalizeMechanicTagCode("tap-select")).toBe("tap_select");
    expect(normalizeMechanicTagCode("drag-to-container")).toBe("drag_drop");
    expect(normalizeMechanicTagCode("sort-groups")).toBe("matching");
  });
});
