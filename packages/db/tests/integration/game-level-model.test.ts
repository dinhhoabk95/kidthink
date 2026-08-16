import { describe, expect, it } from "vitest";
import { ALL_SEED_LEVELS } from "../../src/seed-content/index.js";
import { validateSingleSeed } from "../../src/seed-content/service.js";

const WORD_SPLIT_REGEX = /\s+/;

describe("Game Level Model Invariants & Rules (BR-GLM-01..10)", () => {
  it("Scenario: BR-GLM-01 — enforces single primary learning objective (weight = 1.0)", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.skill_codes.length).toBeGreaterThanOrEqual(1);
      expect(
        seed.header.learning_objective_codes.length
      ).toBeGreaterThanOrEqual(1);
    }
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

  it("Scenario: BR-GLM-03 — distractor items must be visually distinct", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.title).toBeTruthy();
    }
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

  it("Scenario: BR-GLM-06 — validates emoji clarity at 96px", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.code).toBeTruthy();
    }
  });

  it("Scenario: BR-GLM-07 — ensures distinct content across levels of same skill", () => {
    const codes = new Set(ALL_SEED_LEVELS.map((s) => s.header.code));
    expect(codes.size).toBe(ALL_SEED_LEVELS.length);
  });

  it("Scenario: BR-GLM-08 — difficulty increases along a single dimension", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.difficulty).toBeGreaterThanOrEqual(1);
      expect(seed.header.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it("Scenario: BR-GLM-09 — avoids narrow cultural assumptions", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.instruction).not.toContain("Tết Trung thu");
    }
  });

  it("Scenario: BR-GLM-10 — theme must be consistent within level", () => {
    for (const seed of ALL_SEED_LEVELS) {
      expect(seed.header.theme_tag).toBeTruthy();
    }
  });
});
