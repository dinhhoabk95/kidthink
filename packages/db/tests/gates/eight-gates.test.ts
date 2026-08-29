import { describe, expect, it } from "vitest";
import { runEightGates } from "#src/seed-content/gates/runner";
import {
  FIXTURE_GATE_0_INVALID_CODE,
  FIXTURE_GATE_1_EMPTY_CONTENT_PACK,
  FIXTURE_GATE_2_INVALID_STRUCTURE,
  FIXTURE_GATE_3_INVALID_AGE,
  FIXTURE_GATE_4_PEDAGOGICAL_VIOLATION,
  FIXTURE_GATE_5_INVALID_TAXONOMY,
  FIXTURE_GATE_5_UNKNOWN_TAG,
  FIXTURE_GATE_6_INVALID_ORIGIN,
  FIXTURE_GATE_7_SAFETY_VIOLATION,
  VALID_GAME_LEVEL_SEED,
} from "./fixtures/eight-gates-fixtures.js";

describe("Tám cổng thẩm định nội dung seed (BR-CSA-02, Task #117)", () => {
  it("Valid seed passes all 8 gates cleanly", () => {
    const existing = new Set<string>();
    const results = runEightGates(VALID_GAME_LEVEL_SEED, existing);
    const failed = results.filter((r) => !r.passed);
    expect(failed).toHaveLength(0);
  });

  describe("Gate 0: Mã định danh & Trùng lặp", () => {
    it("fails when code format is invalid", () => {
      const results = runEightGates(FIXTURE_GATE_0_INVALID_CODE, new Set());
      const gate0 = results.find((r) => r.gate === 0);
      expect(gate0?.passed).toBe(false);
      expect(gate0?.issues.some((i) => i.code === "CODE_FORMAT_INVALID")).toBe(
        true
      );
    });

    it("fails when code is duplicate in same batch", () => {
      const existing = new Set<string>([VALID_GAME_LEVEL_SEED.header.code]);
      const results = runEightGates(VALID_GAME_LEVEL_SEED, existing);
      const gate0 = results.find((r) => r.gate === 0);
      expect(gate0?.passed).toBe(false);
      expect(gate0?.issues.some((i) => i.code === "CODE_DUPLICATE")).toBe(true);
    });
  });

  describe("Gate 1: Schema & Contract (BR-CSA-16)", () => {
    it("fails when content_pack does not adhere to template contract", () => {
      const results = runEightGates(
        FIXTURE_GATE_1_EMPTY_CONTENT_PACK,
        new Set()
      );
      const gate1 = results.find((r) => r.gate === 1);
      expect(gate1?.passed).toBe(false);
      expect(gate1?.issues.length).toBeGreaterThan(0);
    });

    it("fails with TEMPLATE_CODE_UNKNOWN if template_code is not in registry", () => {
      const seedWithUnknownTemplate = {
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: "GL-C1-CNT-CARD-9988",
          template_code: "GT-999",
        },
      };
      const results = runEightGates(seedWithUnknownTemplate, new Set());
      const gate1 = results.find((r) => r.gate === 1);
      expect(gate1?.passed).toBe(false);
      expect(
        gate1?.issues.some((i) => i.code === "TEMPLATE_CODE_UNKNOWN")
      ).toBe(true);
    });
  });

  describe("Gate 2: Cấu trúc & Giới hạn", () => {
    it("fails when title is empty or version is invalid", () => {
      const results = runEightGates(
        FIXTURE_GATE_2_INVALID_STRUCTURE,
        new Set()
      );
      const gate2 = results.find((r) => r.gate === 2);
      expect(gate2?.passed).toBe(false);
      expect(
        gate2?.issues.some(
          (i) =>
            i.code === "TITLE_EMPTY" || i.code === "CONTENT_VERSION_INVALID"
        )
      ).toBe(true);
    });
  });

  describe("Gate 3: Asset & Tuổi", () => {
    it("fails when age_min > age_max or age out of bounds", () => {
      const results = runEightGates(FIXTURE_GATE_3_INVALID_AGE, new Set());
      const gate3 = results.find((r) => r.gate === 3);
      expect(gate3?.passed).toBe(false);
      expect(
        gate3?.issues.some(
          (i) =>
            i.code === "AGE_RANGE_INVALID" || i.code === "AGE_OUT_OF_BOUNDS"
        )
      ).toBe(true);
    });
  });

  describe("Gate 4: Chất lượng chỉ dẫn (Ngôn ngữ)", () => {
    it("fails when instruction contains forbidden negative words", () => {
      const results = runEightGates(
        FIXTURE_GATE_4_PEDAGOGICAL_VIOLATION,
        new Set()
      );
      const gate4 = results.find((r) => r.gate === 4);
      expect(gate4?.passed).toBe(false);
      expect(
        gate4?.issues.some((i) => i.code === "NEGATIVE_INSTRUCTION_FORBIDDEN")
      ).toBe(true);
    });
  });

  describe("Gate 5: Từ vựng & Sư phạm (BR-TCM-01)", () => {
    it("fails when what_tags or thinking_tags contain non-vocabulary tags", () => {
      const results = runEightGates(FIXTURE_GATE_5_UNKNOWN_TAG, new Set());
      const gate5 = results.find((r) => r.gate === 5);
      expect(gate5?.passed).toBe(false);
      expect(
        gate5?.issues.some((i) => i.code === "TAG_NOT_IN_VOCABULARY")
      ).toBe(true);
    });

    it("fails when skill_codes is empty", () => {
      const results = runEightGates(FIXTURE_GATE_5_INVALID_TAXONOMY, new Set());
      const gate5 = results.find((r) => r.gate === 5);
      expect(gate5?.passed).toBe(false);
      expect(gate5?.issues.some((i) => i.code === "SKILL_CODES_EMPTY")).toBe(
        true
      );
    });

    it("fails when game level is assigned to a banned age band of the engine (BR-ECD-13)", () => {
      const bannedSeed = {
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: "GL-C1-BANNED-BAND-0002",
          template_code: "GT-006",
          age_min: 4,
          age_max: 5,
        },
      };
      const results = runEightGates(bannedSeed, new Set());
      const gate5 = results.find((r) => r.gate === 5);
      expect(gate5?.passed).toBe(false);
      expect(
        gate5?.issues.some((i) => i.code === "ENGINE_AGE_BAND_BANNED")
      ).toBe(true);
    });
  });

  describe("Gate 6: Xuất xứ", () => {
    it("fails when origin is not human or ai_assisted", () => {
      const results = runEightGates(FIXTURE_GATE_6_INVALID_ORIGIN, new Set());
      const gate6 = results.find((r) => r.gate === 6);
      expect(gate6?.passed).toBe(false);
      expect(gate6?.issues.some((i) => i.code === "ORIGIN_INVALID")).toBe(true);
    });
  });

  describe("Gate 7: An toàn trẻ em & Phân quyền", () => {
    it("fails when child safety blocklist matches or access_tier is invalid", () => {
      const results = runEightGates(FIXTURE_GATE_7_SAFETY_VIOLATION, new Set());
      const gate7 = results.find((r) => r.gate === 7);
      expect(gate7?.passed).toBe(false);
      expect(
        gate7?.issues.some(
          (i) =>
            i.code === "CHILD_SAFETY_BLOCKLIST_MATCH" ||
            i.code === "ACCESS_TIER_INVALID"
        )
      ).toBe(true);
    });
  });
});
