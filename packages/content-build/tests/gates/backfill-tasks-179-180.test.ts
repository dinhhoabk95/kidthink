import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { ALL_SEED_LEVELS } from "#src/catalog";
import type { ContentSeed } from "#src/types";

describe("Backfill Content Quality & Contract Verification (Tasks #179 & #180)", () => {
  const TASK_179_TYPES = [
    "D1-06",
    "D1-07",
    "D1-13",
    "D3-04",
    "D3-08",
    "D6-09",
    "D2-02",
    "D2-07",
    "D6-10",
    "D2-04",
    "D2-10",
    "D2-08",
    "D6-06",
  ];

  const TASK_180_TYPES = [
    "D5-03",
    "D6-08",
    "D6-01",
    "D5-08",
    "D2-03",
    "D2-09",
    "D6-02",
    "D6-07",
    "D6-11",
  ];

  const MID_LOAD_BACKFILL_LEVELS = ALL_SEED_LEVELS.filter((l) =>
    TASK_179_TYPES.includes(l.header.legacy_v1_ref ?? "")
  );

  const SINGLE_TYPE_BACKFILL_LEVELS = ALL_SEED_LEVELS.filter((l) =>
    TASK_180_TYPES.includes(l.header.legacy_v1_ref ?? "")
  );

  function validateLevelContracts(levels: ContentSeed<unknown, unknown>[]) {
    for (const level of levels) {
      const template =
        ALL_TEMPLATES[level.header.template_code as keyof typeof ALL_TEMPLATES];
      if (!template) {
        throw new Error(`Template ${level.header.template_code} phải tồn tại`);
      }

      const contentRes = template.content_contract.safeParse(
        level.content_pack
      );
      if (!contentRes.success) {
        throw new Error(
          `Level ${level.header.code} (${level.header.legacy_v1_ref}) hỏng content_contract: ${JSON.stringify(contentRes.error.issues)}`
        );
      }

      const diffRes = template.difficulty_contract.safeParse(
        level.difficulty_params
      );
      if (!diffRes.success) {
        throw new Error(
          `Level ${level.header.code} (${level.header.legacy_v1_ref}) hỏng difficulty_contract: ${JSON.stringify(diffRes.error.issues)}`
        );
      }
    }
  }

  it("Task #179: Chứa đủ 130 levels cho 13 game types (mỗi type 10 levels)", () => {
    expect(MID_LOAD_BACKFILL_LEVELS.length).toBeGreaterThanOrEqual(130);

    const countsByType = new Map<string, number>();
    for (const level of MID_LOAD_BACKFILL_LEVELS) {
      const ref = level.header.legacy_v1_ref ?? "";
      countsByType.set(ref, (countsByType.get(ref) ?? 0) + 1);
    }

    for (const type of TASK_179_TYPES) {
      expect(countsByType.get(type)).toBeGreaterThanOrEqual(10);
    }
  });

  it("Task #179: 100% levels pass content_contract & difficulty_contract của engine tương ứng", () => {
    validateLevelContracts(MID_LOAD_BACKFILL_LEVELS);
  });

  it("Task #179: Các game types chỉ hỗ trợ độ tuổi 4-6 không gán độ tuổi 3", () => {
    const age4to6Types = [
      "D3-04",
      "D3-08",
      "D6-09",
      "D2-02",
      "D2-07",
      "D6-10",
      "D2-04",
      "D2-10",
      "D2-08",
      "D6-06",
    ];

    for (const level of MID_LOAD_BACKFILL_LEVELS) {
      const ref = level.header.legacy_v1_ref ?? "";
      if (age4to6Types.includes(ref)) {
        expect(level.header.age_min).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("Task #180: Chứa đủ 90 levels cho 9 game types", () => {
    expect(SINGLE_TYPE_BACKFILL_LEVELS.length).toBeGreaterThanOrEqual(90);

    const countsByType = new Map<string, number>();
    for (const level of SINGLE_TYPE_BACKFILL_LEVELS) {
      const ref = level.header.legacy_v1_ref ?? "";
      countsByType.set(ref, (countsByType.get(ref) ?? 0) + 1);
    }

    for (const type of TASK_180_TYPES) {
      expect(countsByType.get(type)).toBeGreaterThanOrEqual(10);
    }
  });

  it("Task #180: 100% levels pass content_contract & difficulty_contract của engine tương ứng", () => {
    validateLevelContracts(SINGLE_TYPE_BACKFILL_LEVELS);
  });

  it("Task #180: Tuân thủ nghiêm ngặt giới hạn độ tuổi của từng template", () => {
    const age5to6Types = ["D5-03", "D6-08", "D5-08", "D2-09", "D6-02"];
    const age4to6Types = ["D6-01", "D2-03", "D6-07"];

    for (const level of SINGLE_TYPE_BACKFILL_LEVELS) {
      const ref = level.header.legacy_v1_ref ?? "";
      if (age5to6Types.includes(ref)) {
        expect(level.header.age_min).toBe(5);
        expect(level.header.age_max).toBe(6);
      } else if (age4to6Types.includes(ref)) {
        expect(level.header.age_min).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("Toàn bộ 220 levels backfill có tags hợp lệ theo BR-TAG-01..04", () => {
    const allBackfillLevels = [
      ...MID_LOAD_BACKFILL_LEVELS,
      ...SINGLE_TYPE_BACKFILL_LEVELS,
    ];

    for (const level of allBackfillLevels) {
      expect(level.header.what_tags.length).toBeGreaterThan(0);
      expect(level.header.thinking_tags.length).toBeGreaterThan(0);
      expect(level.header.theme_tag).toBeDefined();
      expect(level.header.skill_codes.length).toBeGreaterThan(0);
      expect(level.header.learning_objective_codes.length).toBeGreaterThan(0);
    }
  });

  it("Toàn bộ 220 levels backfill có access_tier phân bổ hợp lý (free, login, standard)", () => {
    const allBackfillLevels = [
      ...MID_LOAD_BACKFILL_LEVELS,
      ...SINGLE_TYPE_BACKFILL_LEVELS,
    ];

    const freeCount = allBackfillLevels.filter(
      (l) => l.header.access_tier === "free"
    ).length;
    const loginCount = allBackfillLevels.filter(
      (l) => l.header.access_tier === "login"
    ).length;
    const standardCount = allBackfillLevels.filter(
      (l) => l.header.access_tier === "standard"
    ).length;
    const premiumCount = allBackfillLevels.filter(
      (l) => l.header.access_tier === "premium"
    ).length;

    expect(freeCount).toBeGreaterThan(0);
    expect(loginCount).toBeGreaterThan(0);
    expect(standardCount).toBeGreaterThan(0);
    expect(freeCount + loginCount + standardCount + premiumCount).toBe(
      allBackfillLevels.length
    );
  });
});
