import { ALL_SEED_LEVELS } from "@mindkid/content-build";
import { describe, expect, it } from "vitest";
import {
  buildLevelSkillWeightEntries,
  checkDistractorDistinctness,
  checkDuplicateLevelsInSkill,
  checkEmojiInRegistry,
  checkGate6WithSkillDedup,
  checkPrimarySkillWeight,
  checkSingleDimensionDifficultyStep,
  checkThemeConsistency,
} from "#src/gates/game-level-model";
import { runEightGates } from "#src/gates/runner";
import { validateSingleSeed } from "#src/service";
import type { ContentSeed } from "#src/types";

const WORD_SPLIT_REGEX = /\s+/;

/**
 * Ngưỡng baseline chỉ giảm (ratchet) trên corpus ALL_SEED_LEVELS hiện hành:
 * - BR-GLM-06: 475 lượt tham chiếu emoji UTF-8 di sản ngoài @mindkid/emoji
 * - BR-GLM-07: 35 cặp level cùng (skill, template, theme) trùng chữ ký nội dung
 * - BR-GLM-08: 312 bước chuyển độ khó tăng >1 trục độc lập do hợp đồng engine
 */
const CORPUS_NON_CATALOG_EMOJI_BASELINE = 475;
const CORPUS_DUPLICATE_IN_SKILL_BASELINE = 35;
const CORPUS_MULTI_AXIS_DIFFICULTY_STEP_BASELINE = 312;

const BASE_VALID_SEED: ContentSeed = {
  header: {
    code: "GL-C1-CNT-CARD-9901",
    content_version: 1,
    template_code: "GT-001",
    title: "Bé đếm quả táo",
    instruction: "Em hãy đếm xem có mấy quả táo nhé.",
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
    prompt: "Bé chọn quả táo",
    target_item: {
      item_id: "apple",
      asset: { kind: "emoji", ref: "🍎" },
    },
    options: [
      {
        item_id: "apple",
        asset: { kind: "emoji", ref: "🍎" },
        is_correct: true,
      },
      {
        item_id: "banana",
        asset: { kind: "emoji", ref: "🍌" },
        is_correct: false,
      },
    ],
  },
  difficulty_params: {
    item_count: 2,
    distractor_count: 1,
    round_count: 3,
  },
};

describe("Game Level Model Invariants & Rules (BR-GLM-01..10)", () => {
  it("Scenario: BR-GLM-01 — enforces single primary skill with weight = 1.0 and secondary skills < 1.0", () => {
    for (const seed of ALL_SEED_LEVELS) {
      const issues = checkPrimarySkillWeight(seed);
      expect(issues).toEqual([]);
      const entries = buildLevelSkillWeightEntries(seed);
      expect(entries.filter((e) => e.weight === 1.0)).toHaveLength(1);
      for (const secondary of entries.slice(1)) {
        expect(secondary.weight).toBeLessThan(1.0);
        expect(secondary.weight).toBeGreaterThan(0);
      }
    }

    // Ca âm 1: không có skill nào có weight = 1.0
    const noPrimaryIssues = checkPrimarySkillWeight(BASE_VALID_SEED, [0.5]);
    expect(
      noPrimaryIssues.some((i) => i.code === "PRIMARY_SKILL_WEIGHT_INVALID")
    ).toBe(true);

    // Ca âm 2: có 2 skill cùng mang weight = 1.0
    const twoPrimarySeed: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        skill_codes: ["C1.CNT.01", "C1.CNT.02"],
      },
    };
    const twoPrimaryIssues = checkPrimarySkillWeight(
      twoPrimarySeed,
      [1.0, 1.0]
    );
    expect(
      twoPrimaryIssues.some((i) => i.code === "PRIMARY_SKILL_WEIGHT_INVALID")
    ).toBe(true);

    // Ca âm 3: lặp lại cùng một mã kỹ năng trên cùng một level
    const duplicateSkillSeed: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        skill_codes: ["C1.CNT.01", "C1.CNT.01"],
      },
    };
    const dupSkillIssues = checkPrimarySkillWeight(duplicateSkillSeed);
    expect(
      dupSkillIssues.some((i) => i.code === "SKILL_CODE_DUPLICATE_IN_LEVEL")
    ).toBe(true);
  });

  it("Scenario: BR-GLM-02 — validates item limit by age band (3-4 years <= 4 items, 4-5 years <= 6 items)", () => {
    const invalidSeed = {
      header: {
        code: "GL-C1-CNT-CARD-9999",
        content_version: 1,
        template_code: "GT-001",
        title: "Đếm quá số item cho trẻ 3-4 tuổi",
        instruction: "Em hãy đếm xem có mấy quả táo nhé.",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free" as const,
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1.CNT.01-01"],
        what_tags: ["cnt"],
        thinking_tags: ["visual"],
        theme_tag: "farm",
        origin: "human" as const,
        authored_in: "repo_seed" as const,
      },
      content_pack: {
        items: [
          { id: "1", emoji: "🍎" },
          { id: "2", emoji: "🍎" },
          { id: "3", emoji: "🍎" },
          { id: "4", emoji: "🍎" },
          { id: "5", emoji: "🍎" },
          { id: "6", emoji: "🍎" },
        ],
        target_count: 6,
      },
      difficulty_params: { count_limit: 10 },
    };

    expect(() => validateSingleSeed(invalidSeed)).toThrow();
  });

  it("Scenario: BR-GLM-03 — distractor items must be distinct from correct answers", () => {
    const allDistractorIssues = ALL_SEED_LEVELS.flatMap((seed) =>
      checkDistractorDistinctness(seed)
    );
    expect(allDistractorIssues).toEqual([]);

    // Ca âm: phần tử nhiễu có cùng emoji/signature với đáp án đúng
    const collidingDistractorSeed: ContentSeed = {
      ...BASE_VALID_SEED,
      content_pack: {
        prompt: "Bé chọn quả táo",
        options: [
          {
            item_id: "opt-1",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: true,
          },
          {
            item_id: "opt-2",
            asset: { kind: "emoji", ref: "🍎" },
            is_correct: false,
          },
        ],
      },
    };
    const collisionIssues = checkDistractorDistinctness(
      collidingDistractorSeed
    );
    expect(
      collisionIssues.some((i) => i.code === "DISTRACTOR_COLLIDES_WITH_CORRECT")
    ).toBe(true);
  });

  it("Scenario: BR-GLM-04 — instruction length must be <= 12 words", () => {
    for (const seed of ALL_SEED_LEVELS) {
      const wordCount = seed.header.instruction
        .trim()
        .split(WORD_SPLIT_REGEX).length;
      expect(wordCount).toBeLessThanOrEqual(12);
    }

    const longInstructionSeed = {
      header: {
        code: "GL-C1-CNT-CARD-9998",
        content_version: 1,
        template_code: "GT-001",
        title: "Chỉ dẫn quá dài",
        instruction:
          "Em hãy nhanh tay đếm tất cả những quả táo đỏ tươi ngon này thật cẩn thận để xem có tổng cộng bao nhiêu quả tất cả.",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free" as const,
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1.CNT.01-01"],
        what_tags: ["cnt"],
        thinking_tags: ["visual"],
        theme_tag: "farm",
        origin: "human" as const,
        authored_in: "repo_seed" as const,
      },
      content_pack: { items: [{ id: "1", emoji: "🍎" }], target_count: 1 },
      difficulty_params: { count_limit: 5 },
    };

    expect(() => validateSingleSeed(longInstructionSeed)).toThrow();
  });

  it("Scenario: BR-GLM-05 — instruction must not contain negative words ('không', 'đừng')", () => {
    for (const seed of ALL_SEED_LEVELS) {
      const lower = seed.header.instruction.toLowerCase();
      expect(lower).not.toContain("đừng");
    }

    const negativeInstructionSeed = {
      header: {
        code: "GL-C1-CNT-CARD-9997",
        content_version: 1,
        template_code: "GT-001",
        title: "Chỉ dẫn phủ định",
        instruction: "Em đừng chọn quả táo màu xanh nhé.",
        age_min: 3,
        age_max: 4,
        difficulty: 1,
        access_tier: "free" as const,
        skill_codes: ["C1.CNT.01"],
        learning_objective_codes: ["LO-C1.CNT.01-01"],
        what_tags: ["cnt"],
        thinking_tags: ["visual"],
        theme_tag: "farm",
        origin: "human" as const,
        authored_in: "repo_seed" as const,
      },
      content_pack: { items: [{ id: "1", emoji: "🍎" }], target_count: 1 },
      difficulty_params: { count_limit: 5 },
    };

    expect(() => validateSingleSeed(negativeInstructionSeed)).toThrow();
  });

  it("Scenario: BR-GLM-06 — validates emoji references belong to @mindkid/emoji registry", () => {
    const allEmojiIssues = ALL_SEED_LEVELS.flatMap((seed) =>
      checkEmojiInRegistry(seed)
    );
    expect(allEmojiIssues.length).toBeLessThanOrEqual(
      CORPUS_NON_CATALOG_EMOJI_BASELINE
    );

    // Ca âm: sử dụng glyph ngoài registry @mindkid/emoji
    const unknownEmojiSeed: ContentSeed = {
      ...BASE_VALID_SEED,
      content_pack: {
        prompt: "Bé chọn ký hiệu lạ",
        target_item: {
          item_id: "alien",
          asset: { kind: "emoji", ref: "🧿" },
        },
        options: [
          {
            item_id: "alien",
            asset: { kind: "emoji", ref: "🧿" },
            is_correct: true,
          },
        ],
      },
    };
    const emojiIssues = checkEmojiInRegistry(unknownEmojiSeed);
    expect(emojiIssues.some((i) => i.code === "EMOJI_NOT_IN_REGISTRY")).toBe(
      true
    );
  });

  it("Scenario: BR-GLM-07 & AC §9 — Gate 6 rejects duplicate content in same skill differing only by quantity and reports duplicate code", () => {
    const codes = new Set(ALL_SEED_LEVELS.map((s) => s.header.code));
    expect(codes.size).toBe(ALL_SEED_LEVELS.length);

    const corpusDupIssues = checkDuplicateLevelsInSkill(ALL_SEED_LEVELS);
    expect(corpusDupIssues.length).toBeLessThanOrEqual(
      CORPUS_DUPLICATE_IN_SKILL_BASELINE
    );

    // Ca âm: level thứ hai cùng skill C1.CNT.01 chỉ đổi số lượng nhưng giữ nguyên nội dung
    const levelA: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        code: "GL-C1-CNT-CARD-9910",
        difficulty: 1,
      },
      content_pack: {
        prompt: "Đếm 2 quả táo",
        target_count: 2,
        items: [
          { asset: { kind: "emoji", ref: "🍎" } },
          { asset: { kind: "emoji", ref: "🍎" } },
        ],
      },
    };
    const levelBDupOnlyQuantity: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        code: "GL-C1-CNT-CARD-9911",
        difficulty: 2,
      },
      content_pack: {
        prompt: "Đếm 4 quả táo",
        target_count: 4,
        items: [
          { asset: { kind: "emoji", ref: "🍎" } },
          { asset: { kind: "emoji", ref: "🍎" } },
          { asset: { kind: "emoji", ref: "🍎" } },
          { asset: { kind: "emoji", ref: "🍎" } },
        ],
      },
    };

    const gate6Result = checkGate6WithSkillDedup(levelBDupOnlyQuantity, [
      levelA,
    ]);
    expect(gate6Result.passed).toBe(false);
    expect(
      gate6Result.issues.some((i) => i.code === "DUPLICATE_CONTENT_IN_SKILL")
    ).toBe(true);
    expect(gate6Result.issues[0]?.message).toContain("GL-C1-CNT-CARD-9910");

    // Kiểm tra tích hợp trực tiếp qua runEightGates tại Cổng 6
    const eightGateResults = runEightGates(
      levelBDupOnlyQuantity,
      new Set([levelA.header.code]),
      undefined,
      undefined,
      undefined,
      [levelA]
    );
    const gate6FromRunner = eightGateResults.find((g) => g.gate === 6);
    expect(gate6FromRunner?.passed).toBe(false);
    expect(gate6FromRunner?.issues[0]?.message).toContain(
      "GL-C1-CNT-CARD-9910"
    );
  });

  it("Scenario: BR-GLM-08 — difficulty increases along a single dimension between adjacent levels", () => {
    const corpusStepIssues =
      checkSingleDimensionDifficultyStep(ALL_SEED_LEVELS);
    expect(corpusStepIssues.length).toBeLessThanOrEqual(
      CORPUS_MULTI_AXIS_DIFFICULTY_STEP_BASELINE
    );

    // Ca âm: hai level kế tiếp cùng (skill, template) tăng 2 chiều độ khó độc lập cùng lúc (target_count + distractor_count)
    const easyLevel: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        code: "GL-C1-CNT-CARD-9920",
        difficulty: 1,
      },
      difficulty_params: {
        target_count: 1,
        distractor_count: 1,
        round_count: 3,
      },
    };
    const multiJumpLevel: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        code: "GL-C1-CNT-CARD-9921",
        difficulty: 2,
      },
      difficulty_params: {
        target_count: 2,
        distractor_count: 3,
        round_count: 3,
      },
    };

    const jumpIssues = checkSingleDimensionDifficultyStep([
      easyLevel,
      multiJumpLevel,
    ]);
    expect(
      jumpIssues.some((i) => i.code === "MULTI_DIMENSION_DIFFICULTY_JUMP")
    ).toBe(true);
  });

  it("Scenario: BR-GLM-09 — avoids narrow cultural assumptions", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.instruction).not.toContain("Tết Trung thu");
    }
  });

  it("Scenario: BR-GLM-10 — theme must belong to CONTENT_THEMES and stay consistent within level", () => {
    for (const seed of ALL_SEED_LEVELS) {
      const issues = checkThemeConsistency(seed);
      expect(issues).toEqual([]);
    }

    // Ca âm 1: theme_tag không thuộc CONTENT_THEMES
    const unknownThemeSeed: ContentSeed = {
      ...BASE_VALID_SEED,
      header: {
        ...BASE_VALID_SEED.header,
        theme_tag: "cyberpunk_city",
      },
    };
    expect(
      checkThemeConsistency(unknownThemeSeed).some(
        (i) => i.code === "THEME_NOT_IN_CATALOG"
      )
    ).toBe(true);

    // Ca âm 2: round bên trong có theme_tag lệch với header.theme_tag
    const inconsistentThemeSeed: ContentSeed = {
      ...BASE_VALID_SEED,
      rounds: [
        {
          instruction: "Em hãy đếm xem có mấy quả táo nhé.",
          difficulty: 1,
          difficulty_params: {
            item_count: 2,
            distractor_count: 1,
          },
          content_pack: {
            prompt: "Bé chọn quả táo",
            theme_tag: "ocean",
          },
        },
      ],
    };
    expect(
      checkThemeConsistency(inconsistentThemeSeed).some(
        (i) => i.code === "THEME_INCONSISTENT_IN_LEVEL"
      )
    ).toBe(true);
  });
});
