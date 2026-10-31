import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import { ALL_SEED_LEVELS } from "#src/catalog";
import type { ContentSeed } from "#src/types";

describe("Backfill Content Quality & Contract Verification (Tasks #179 & #180)", () => {
  const TASK_179_TEMPLATES = [
    "GT-004",
    "GT-005",
    "GT-011",
    "GT-012",
    "GT-013",
    "GT-014",
    "GT-016",
    "GT-017",
    "GT-024",
    "GT-031",
    "GT-035",
  ];

  const TASK_180_TEMPLATES = [
    "GT-015",
    "GT-025",
    "GT-026",
    "GT-030",
    "GT-032",
    "GT-033",
    "GT-034",
    "GT-036",
    "GT-037",
  ];

  const MID_LOAD_BACKFILL_LEVELS = ALL_SEED_LEVELS.filter((l) =>
    TASK_179_TEMPLATES.includes(l.header.template_code)
  );

  const SINGLE_TYPE_BACKFILL_LEVELS = ALL_SEED_LEVELS.filter((l) =>
    TASK_180_TEMPLATES.includes(l.header.template_code)
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
          `Level ${level.header.code} (${level.header.template_code}) hỏng content_contract: ${JSON.stringify(contentRes.error.issues)}`
        );
      }

      const diffRes = template.difficulty_contract.safeParse(
        level.difficulty_params
      );
      if (!diffRes.success) {
        throw new Error(
          `Level ${level.header.code} (${level.header.template_code}) hỏng difficulty_contract: ${JSON.stringify(diffRes.error.issues)}`
        );
      }
    }
  }

  it("Task #179: Chứa đủ ≥39 levels cho các template nhóm 1 (mỗi template ≥3 levels theo BR-SKQ-02)", () => {
    expect(MID_LOAD_BACKFILL_LEVELS.length).toBeGreaterThanOrEqual(39);

    const countsByTemplate = new Map<string, number>();
    for (const level of MID_LOAD_BACKFILL_LEVELS) {
      const tCode = level.header.template_code;
      countsByTemplate.set(tCode, (countsByTemplate.get(tCode) ?? 0) + 1);
    }

    for (const tCode of TASK_179_TEMPLATES) {
      expect(countsByTemplate.get(tCode)).toBeGreaterThanOrEqual(3);
    }
  });

  it("Task #179: 100% levels pass content_contract & difficulty_contract của engine tương ứng", () => {
    validateLevelContracts(MID_LOAD_BACKFILL_LEVELS);
  });

  it("Task #179: Các template chỉ hỗ trợ độ tuổi 4-6 không gán độ tuổi 3", () => {
    const age4to6Templates = [
      "GT-011",
      "GT-013",
      "GT-014",
      "GT-016",
      "GT-017",
      "GT-024",
      "GT-031",
      "GT-035",
    ];

    for (const level of MID_LOAD_BACKFILL_LEVELS) {
      const tCode = level.header.template_code;
      if (age4to6Templates.includes(tCode)) {
        expect(level.header.age_min).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("Task #180: Chứa đủ ≥27 levels cho các template nhóm 2 (mỗi template ≥3 levels theo BR-SKQ-02/04)", () => {
    expect(SINGLE_TYPE_BACKFILL_LEVELS.length).toBeGreaterThanOrEqual(27);

    const countsByTemplate = new Map<string, number>();
    for (const level of SINGLE_TYPE_BACKFILL_LEVELS) {
      const tCode = level.header.template_code;
      countsByTemplate.set(tCode, (countsByTemplate.get(tCode) ?? 0) + 1);
    }

    for (const tCode of TASK_180_TEMPLATES) {
      expect(countsByTemplate.get(tCode)).toBeGreaterThanOrEqual(3);
    }
  });

  it("Task #180: 100% levels pass content_contract & difficulty_contract của engine tương ứng", () => {
    validateLevelContracts(SINGLE_TYPE_BACKFILL_LEVELS);
  });

  it("Task #180: Tuân thủ nghiêm ngặt giới hạn độ tuổi của từng template", () => {
    const age5to6Templates = ["GT-015", "GT-032", "GT-033", "GT-036"];
    const age4to6Templates = ["GT-025", "GT-026", "GT-030", "GT-034"];

    for (const level of SINGLE_TYPE_BACKFILL_LEVELS) {
      const tCode = level.header.template_code;
      if (age5to6Templates.includes(tCode)) {
        expect(level.header.age_min).toBe(5);
        expect(level.header.age_max).toBe(6);
      } else if (age4to6Templates.includes(tCode)) {
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
