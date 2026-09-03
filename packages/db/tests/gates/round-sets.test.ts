import { describe, expect, it } from "vitest";
import { evaluateRoundSets } from "#src/seed-content/gates/round-sets";
import type { ContentSeed } from "#src/seed-content/types";

describe("Gate check:round-sets (BR-RSM-01..13)", () => {
  const validLevelCtx = {
    code: "GL-C1-CNT-NUM-0001",
    content_version: 1,
    template_code: "GT-001",
    title: "Màn chơi hợp lệ",
    instruction: "Đếm số",
    age_min: 3,
    age_max: 4,
    difficulty: 1,
    access_tier: "free" as const,
    skill_codes: ["C1.CNT.01"],
    learning_objective_codes: ["LO-C1.CNT.01-01"],
    what_tags: ["fruits"],
    thinking_tags: ["counting"],
    origin: "human" as const,
    authored_in: "studio" as const,
  };

  const contentRound1 = {
    prompt: "Tìm quả táo đỏ",
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

  const contentRound2 = {
    prompt: "Tìm quả chuối vàng",
    target_item: {
      item_id: "banana",
      asset: { kind: "emoji" as const, ref: "🍌" },
    },
    options: [
      {
        item_id: "banana",
        asset: { kind: "emoji" as const, ref: "🍌" },
        is_correct: true,
      },
      {
        item_id: "apple",
        asset: { kind: "emoji" as const, ref: "🍎" },
        is_correct: false,
      },
      {
        item_id: "orange",
        asset: { kind: "emoji" as const, ref: "🍊" },
        is_correct: false,
      },
    ],
  };

  const contentRound3 = {
    prompt: "Tìm quả cam",
    target_item: {
      item_id: "orange",
      asset: { kind: "emoji" as const, ref: "🍊" },
    },
    options: [
      {
        item_id: "orange",
        asset: { kind: "emoji" as const, ref: "🍊" },
        is_correct: true,
      },
      {
        item_id: "apple",
        asset: { kind: "emoji" as const, ref: "🍎" },
        is_correct: false,
      },
      {
        item_id: "banana",
        asset: { kind: "emoji" as const, ref: "🍌" },
        is_correct: false,
      },
    ],
  };

  it("passes valid single-round seed", () => {
    const singleSeed: ContentSeed = {
      kind: "game_level",
      header: validLevelCtx,
      content_pack: contentRound1,
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
    };

    const result = evaluateRoundSets([singleSeed]);
    expect(result.isPassed).toBe(true);
    expect(result.singleRoundLevelsCount).toBe(1);
    expect(result.violations).toHaveLength(0);
  });

  it("passes valid multi-round seed with monotonic 1-axis escalation", () => {
    const multiSeed: ContentSeed = {
      kind: "game_level",
      header: validLevelCtx,
      content_pack: contentRound1,
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
      rounds: [
        {
          instruction: "Bé tìm quả táo",
          content_pack: contentRound1,
          difficulty_params: {
            distractor_count: 1,
            hint_after_ms: 10_000,
            allow_retry: true,
            shuffle_items: true,
          },
          difficulty: 1,
        },
        {
          instruction: "Bé tìm quả chuối",
          content_pack: contentRound2,
          difficulty_params: {
            distractor_count: 2,
            hint_after_ms: 10_000,
            allow_retry: true,
            shuffle_items: true,
          },
          difficulty: 1,
        },
        {
          instruction: "Bé tìm quả cam",
          content_pack: contentRound3,
          difficulty_params: {
            distractor_count: 2,
            hint_after_ms: 10_000,
            allow_retry: true,
            shuffle_items: true,
          },
          difficulty: 2,
        },
      ],
    };

    const result = evaluateRoundSets([multiSeed]);
    expect(result.isPassed).toBe(true);
    expect(result.multiRoundLevelsCount).toBe(1);
    expect(result.violations).toHaveLength(0);
  });

  it("fails (ca âm) when round set escalates on 2 difficulty axes simultaneously (BR-RSM-05)", () => {
    const invalidMultiSeed: ContentSeed = {
      kind: "game_level",
      header: validLevelCtx,
      content_pack: contentRound1,
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
      rounds: [
        {
          instruction: "Bé tìm quả táo",
          content_pack: contentRound1,
          difficulty_params: {
            distractor_count: 1,
            max_moves: 5,
            allow_retry: true,
            shuffle_items: true,
          },
          difficulty: 1,
        },
        {
          instruction: "Bé tìm quả chuối",
          content_pack: contentRound2,
          difficulty_params: {
            distractor_count: 3,
            max_moves: 8,
            allow_retry: true,
            shuffle_items: true,
          },
          difficulty: 1,
        },
      ],
    };

    const result = evaluateRoundSets([invalidMultiSeed]);
    expect(result.isPassed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.ruleCode === "BR-RSM-05")).toBe(
      true
    );
  });

  it("fails (ca âm) when round count exceeds age band ceiling (BR-RSM-03)", () => {
    // Band 3-4 ceiling is 6 rounds (D-167A)
    const tooManyRounds = Array.from({ length: 7 }, (_, i) => ({
      instruction: `Vòng ${i + 1}`,
      content_pack: { ...contentRound1, prompt: `Vòng ${i + 1}` },
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
      difficulty: 1,
    }));

    const invalidCeilingSeed: ContentSeed = {
      kind: "game_level",
      header: { ...validLevelCtx, age_min: 3, age_max: 4 },
      content_pack: contentRound1,
      difficulty_params: {
        distractor_count: 1,
        hint_after_ms: 10_000,
        allow_retry: true,
        shuffle_items: true,
      },
      rounds: tooManyRounds,
    };

    const result = evaluateRoundSets([invalidCeilingSeed]);
    expect(result.isPassed).toBe(false);
    expect(result.violations.some((v) => v.ruleCode === "BR-RSM-03")).toBe(
      true
    );
  });
});
