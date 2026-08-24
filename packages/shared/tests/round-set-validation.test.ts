import { describe, expect, it } from "vitest";
import {
  type RoundInput,
  type RoundSetInput,
  validateRoundSet,
} from "#src/round-set-validation";

function makeRound(overrides: Partial<RoundInput> = {}): RoundInput {
  return {
    round_index: 0,
    template_code: "GT-001",
    instruction: "Bé chọn quả đỏ nhé!",
    content_pack: { options: [{ id: "a", emoji: "🍎" }] },
    difficulty_params: { item_count: 3, distractor_count: 1 },
    difficulty: 1,
    age_min: 3,
    age_max: 4,
    theme_id: "farm",
    ...overrides,
  };
}

function makeSet(
  rounds: RoundInput[],
  overrides: Partial<Omit<RoundSetInput, "rounds">> = {}
): RoundSetInput {
  return {
    rounds,
    learning_objective_count: 1,
    ...overrides,
  };
}

describe("BR-RSM — Round Set Validation", () => {
  describe("BR-RSM-01: one template per set", () => {
    it("rejects set with mixed templates", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, template_code: "GT-001" }),
          makeRound({ round_index: 1, template_code: "GT-003" }),
        ])
      );
      expect(result.ok).toBe(false);
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-01",
          round_index: 1,
        })
      );
    });

    it("accepts set with same template", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0 }),
          makeRound({
            round_index: 1,
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      const rsm01 = result.violations.filter((v) => v.rule === "BR-RSM-01");
      expect(rsm01).toHaveLength(0);
    });
  });

  describe("BR-RSM-02: one learning objective per set", () => {
    it("rejects set with 0 learning objectives", () => {
      const result = validateRoundSet(
        makeSet([makeRound()], { learning_objective_count: 0 })
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({ rule: "BR-RSM-02" })
      );
    });

    it("rejects set with 2 learning objectives", () => {
      const result = validateRoundSet(
        makeSet([makeRound()], { learning_objective_count: 2 })
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({ rule: "BR-RSM-02" })
      );
    });

    it("accepts set with exactly 1 learning objective", () => {
      const result = validateRoundSet(makeSet([makeRound()]));
      const rsm02 = result.violations.filter((v) => v.rule === "BR-RSM-02");
      expect(rsm02).toHaveLength(0);
    });
  });

  describe("BR-RSM-03: round count within band ceiling", () => {
    it("rejects band 3-4 with 5 rounds", () => {
      const rounds = Array.from({ length: 5 }, (_, i) =>
        makeRound({
          round_index: i,
          content_pack: { options: [{ id: `item-${i}`, emoji: "🍎" }] },
          difficulty: i + 1 > 5 ? 5 : i + 1,
          difficulty_params: { item_count: 3 + i },
          instruction: `Bé làm bước ${i + 1} nhé!`,
        })
      );
      const result = validateRoundSet(makeSet(rounds));
      expect(result.violations).toContainEqual(
        expect.objectContaining({ rule: "BR-RSM-03" })
      );
    });

    it("accepts band 3-4 with 4 rounds", () => {
      const rounds = Array.from({ length: 4 }, (_, i) =>
        makeRound({
          round_index: i,
          content_pack: { options: [{ id: `item-${i}`, emoji: "🍎" }] },
          difficulty: i + 1,
          difficulty_params: { item_count: 3 + i },
          instruction: `Bé làm bước ${i + 1} nhé!`,
        })
      );
      const result = validateRoundSet(makeSet(rounds));
      const rsm03 = result.violations.filter((v) => v.rule === "BR-RSM-03");
      expect(rsm03).toHaveLength(0);
    });
  });

  describe("BR-RSM-04: each round content_pack must parse", () => {
    it("rejects round with invalid content_pack", () => {
      const result = validateRoundSet(
        makeSet([makeRound()], {
          content_contract_validator: () => ({
            success: false,
            error: { message: "missing field options" },
          }),
        })
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-04",
          round_index: 0,
        })
      );
    });

    it("accepts round with valid content_pack", () => {
      const result = validateRoundSet(
        makeSet([makeRound()], {
          content_contract_validator: () => ({ success: true }),
        })
      );
      const rsm04 = result.violations.filter((v) => v.rule === "BR-RSM-04");
      expect(rsm04).toHaveLength(0);
    });
  });

  describe("BR-RSM-05: only one difficulty dimension increases between adjacent rounds", () => {
    it("rejects increasing two dimensions at once", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({
            round_index: 0,
            difficulty_params: { item_count: 3, distractor_count: 1 },
          }),
          makeRound({
            round_index: 1,
            difficulty_params: { item_count: 4, distractor_count: 2 },
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-05",
          round_index: 1,
        })
      );
    });

    it("accepts increasing one dimension", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({
            round_index: 0,
            difficulty_params: { item_count: 3, distractor_count: 1 },
          }),
          makeRound({
            round_index: 1,
            difficulty_params: { item_count: 4, distractor_count: 1 },
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      const rsm05 = result.violations.filter((v) => v.rule === "BR-RSM-05");
      expect(rsm05).toHaveLength(0);
    });
  });

  describe("BR-RSM-06: first round must be lowest difficulty", () => {
    it("rejects when first round is not easiest", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, difficulty: 3 }),
          makeRound({
            round_index: 1,
            difficulty: 1,
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
          makeRound({
            round_index: 2,
            difficulty: 2,
            content_pack: { options: [{ id: "c", emoji: "🍇" }] },
          }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({ rule: "BR-RSM-06" })
      );
    });
  });

  describe("BR-RSM-07: consistent theme", () => {
    it("rejects mixed themes", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, theme_id: "farm" }),
          makeRound({
            round_index: 1,
            theme_id: "ocean",
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-07",
          round_index: 1,
        })
      );
    });
  });

  describe("BR-RSM-08: no adjacent rounds with same content", () => {
    it("rejects adjacent rounds with identical content (only options reordered)", () => {
      const pack = {
        options: [
          { id: "a", emoji: "🍎" },
          { id: "b", emoji: "🍊" },
        ],
      };
      const packReordered = {
        options: [
          { id: "b", emoji: "🍊" },
          { id: "a", emoji: "🍎" },
        ],
      };
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, content_pack: pack }),
          makeRound({ round_index: 1, content_pack: packReordered }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-08",
          round_index: 1,
        })
      );
    });

    it("accepts adjacent rounds with different content", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({
            round_index: 0,
            content_pack: { options: [{ id: "a" }] },
          }),
          makeRound({
            round_index: 1,
            content_pack: { options: [{ id: "b" }] },
          }),
        ])
      );
      const rsm08 = result.violations.filter((v) => v.rule === "BR-RSM-08");
      expect(rsm08).toHaveLength(0);
    });
  });

  describe("BR-RSM-09: single-round set is valid", () => {
    it("accepts a set with exactly one round", () => {
      const result = validateRoundSet(makeSet([makeRound()]));
      expect(result.ok).toBe(true);
    });

    it("rejects empty set", () => {
      const result = validateRoundSet(makeSet([]));
      expect(result.ok).toBe(false);
    });
  });

  describe("BR-RSM-10: total payload <= 200KB gzipped", () => {
    it("rejects set exceeding payload limit", () => {
      // Crypto random bytes are incompressible — 300KB raw > 200KB gzipped
      const crypto = require("node:crypto");
      const bigContent = crypto.randomBytes(300_000).toString("base64");
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, content_pack: { data: bigContent } }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({ rule: "BR-RSM-10" })
      );
    });
  });

  describe("BR-RSM-11: instruction per round", () => {
    it("rejects instruction with more than 12 words", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({
            instruction:
              "Bé hãy chọn tất cả các quả màu đỏ và bỏ chúng vào giỏ lớn ở bên phải nhé con yêu",
          }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-11",
          round_index: 0,
        })
      );
    });

    it("rejects instruction with negation", () => {
      const result = validateRoundSet(
        makeSet([makeRound({ instruction: "Bé không chọn quả xanh nhé!" })])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-11",
          round_index: 0,
          message: expect.stringContaining("negation"),
        })
      );
    });

    it("rejects missing instruction", () => {
      const result = validateRoundSet(
        makeSet([makeRound({ instruction: null })])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({ rule: "BR-RSM-11" })
      );
    });

    it("accepts valid instruction", () => {
      const result = validateRoundSet(
        makeSet([makeRound({ instruction: "Bé chọn quả đỏ nhé!" })])
      );
      const rsm11 = result.violations.filter((v) => v.rule === "BR-RSM-11");
      expect(rsm11).toHaveLength(0);
    });
  });

  describe("BR-RSM-13: all rounds same age band", () => {
    it("rejects mixed bands", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, age_min: 3, age_max: 4 }),
          makeRound({
            round_index: 1,
            age_min: 5,
            age_max: 6,
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      expect(result.violations).toContainEqual(
        expect.objectContaining({
          rule: "BR-RSM-13",
          round_index: 1,
        })
      );
    });

    it("accepts all rounds same band", () => {
      const result = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0 }),
          makeRound({
            round_index: 1,
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      const rsm13 = result.violations.filter((v) => v.rule === "BR-RSM-13");
      expect(rsm13).toHaveLength(0);
    });
  });

  describe("BR-TYP-07 — negative tests (ca âm)", () => {
    it("gate must catch violations — NOT silently pass", () => {
      const twoTemplates = validateRoundSet(
        makeSet([
          makeRound({ round_index: 0, template_code: "GT-001" }),
          makeRound({ round_index: 1, template_code: "GT-003" }),
        ])
      );
      expect(twoTemplates.ok).toBe(false);

      const twoDimensions = validateRoundSet(
        makeSet([
          makeRound({
            round_index: 0,
            difficulty_params: { item_count: 3, distractor_count: 1 },
          }),
          makeRound({
            round_index: 1,
            difficulty_params: { item_count: 5, distractor_count: 3 },
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      expect(twoDimensions.ok).toBe(false);
      expect(twoDimensions.violations.some((v) => v.rule === "BR-RSM-05")).toBe(
        true
      );
    });

    it("valid set must pass — gate without negative case is gate not yet done", () => {
      const valid = validateRoundSet(
        makeSet([
          makeRound({
            round_index: 0,
            difficulty: 1,
            difficulty_params: { item_count: 3 },
            content_pack: { options: [{ id: "a", emoji: "🍎" }] },
          }),
          makeRound({
            round_index: 1,
            difficulty: 2,
            difficulty_params: { item_count: 4 },
            content_pack: { options: [{ id: "b", emoji: "🍊" }] },
          }),
        ])
      );
      expect(valid.ok).toBe(true);
    });
  });
});
