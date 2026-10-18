import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { describe, expect, it } from "vitest";
import {
  checkAdaptiveDifficultyBoundary,
  checkConfigLimits,
  checkConfigMonotonicity,
  checkCorpusLevels,
  checkDifficultyLadder,
  checkSkillDifficulties,
} from "#scripts/check-difficulty-ladder.js";
import {
  countHardcodedLinesInCode,
  countSchemaDefaultsInCode,
  hasForbiddenDifficultyDefault,
  scanHardcodedParams,
} from "#scripts/check-hardcoded-params.js";
import {
  type EngineDifficultyParamsConfig,
  EngineDifficultyParamsConfigSchema,
} from "#src/contracts/engine-difficulty-config.js";

const CONFIG_PATH = repoPath(
  "packages/game-engine/config/engine-difficulty-params.json"
);

describe("Cổng check:difficulty-ladder và check:hardcoded-params (Task #263 T6 / BR-LDC-01, BR-LDC-02, BR-LDC-03, BR-LDC-04, BR-LDC-05, BR-LDC-06, BR-LDC-07, BR-LDC-08)", () => {
  const rawConfig = fs.readFileSync(CONFIG_PATH, "utf-8");
  const validConfig = EngineDifficultyParamsConfigSchema.parse(
    JSON.parse(rawConfig)
  ) as EngineDifficultyParamsConfig;

  describe("checkConfigLimits (BR-LDC-01)", () => {
    it("BR-LDC-01: pass trên cấu hình chuẩn engine-difficulty-params.json", () => {
      const issues = checkConfigLimits(validConfig);
      expect(issues).toHaveLength(0);
    });

    it("BR-LDC-01: ca âm — bắt lỗi khi item_count vượt trần maxLimit của template", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      const gt1 = cloned.engines["GT-001"];
      if (gt1?.levels["5"]) {
        gt1.levels["5"].item_count = 10;
      }

      const issues = checkConfigLimits(cloned);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues.some((i) => i.code === "ITEM_COUNT_OUT_OF_LIMITS")).toBe(
        true
      );
      expect(issues.some((i) => i.engineCode === "GT-001")).toBe(true);
    });

    it("BR-LDC-01: ca âm — bắt lỗi khi item_count nhỏ hơn sàn minLimit của template", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      const gt1 = cloned.engines["GT-001"];
      if (gt1?.levels["1"]) {
        gt1.levels["1"].item_count = 1;
      }

      const issues = checkConfigLimits(cloned);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues.some((i) => i.code === "ITEM_COUNT_OUT_OF_LIMITS")).toBe(
        true
      );
    });
  });

  describe("checkConfigMonotonicity (BR-LDC-03, BR-LDC-05)", () => {
    it("BR-LDC-03: pass trên cấu hình chuẩn engine-difficulty-params.json", () => {
      const issues = checkConfigMonotonicity(validConfig);
      expect(issues).toHaveLength(0);
    });

    it("BR-LDC-03: ca âm — bắt lỗi khi item_count giảm khi độ khó tăng trong bảng tra (descending)", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      const gt1 = cloned.engines["GT-001"];
      if (gt1?.levels["3"] && gt1?.levels["2"]) {
        gt1.levels["3"].item_count = 2;
        gt1.levels["2"].item_count = 4;
      }

      const issues = checkConfigMonotonicity(cloned);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(
        issues.some(
          (i) =>
            i.code === "DIFFICULTY_ITEM_COUNT_DESCENDING" &&
            i.message.includes("BR-LDC-03")
        )
      ).toBe(true);
      expect(issues.some((i) => i.engineCode === "GT-001")).toBe(true);
    });

    it("BR-LDC-03: ca âm — hai level cùng kỹ năng dùng GT-002 có item_count giảm từ 4 xuống 3 khi difficulty tăng từ 3 lên 4", () => {
      const { issues } = checkCorpusLevels(validConfig, [
        {
          header: {
            code: "GL-C1-CNT-0001",
            template_code: "GT-002",
            difficulty: 3,
            skill_codes: ["C1.CNT.01"],
          },
          difficulty_params: { item_count: 4 },
        },
        {
          header: {
            code: "GL-C1-CNT-0002",
            template_code: "GT-002",
            difficulty: 4,
            skill_codes: ["C1.CNT.01"],
          },
          difficulty_params: { item_count: 3 },
        },
      ]);

      expect(
        issues.some(
          (i) =>
            i.code === "LEVEL_SKILL_ITEM_COUNT_DESCENDING" &&
            i.engineCode === "GT-002" &&
            i.skillCode === "C1.CNT.01" &&
            i.message.includes("BR-LDC-03")
        )
      ).toBe(true);
    });

    it("BR-LDC-05: ca dương — ngoại lệ difficulty_fixed: true (GT-000, GT-013) cho phép giữ nguyên item_count ở mọi mức khó", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      const gt0 = cloned.engines["GT-000"];
      if (gt0) {
        gt0.difficulty_fixed = true;
        gt0.levels["1"].item_count = 1;
        gt0.levels["2"].item_count = 1;
        gt0.levels["3"].item_count = 1;
        gt0.levels["4"].item_count = 1;
        gt0.levels["5"].item_count = 1;
      }

      const issues = checkConfigMonotonicity(cloned);
      expect(issues.filter((i) => i.engineCode === "GT-000")).toHaveLength(0);
    });

    it("BR-LDC-05: ca âm — engine giữ nguyên item_count từ mức 1 đến mức 5 nhưng không khai difficulty_fixed: true thì bị chặn", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      const gt2 = cloned.engines["GT-002"];
      if (gt2) {
        gt2.difficulty_fixed = false;
        gt2.levels["1"].item_count = 4;
        gt2.levels["2"].item_count = 4;
        gt2.levels["3"].item_count = 4;
        gt2.levels["4"].item_count = 4;
        gt2.levels["5"].item_count = 4;
      }

      const issues = checkConfigMonotonicity(cloned);
      expect(
        issues.some(
          (i) =>
            i.code === "DIFFICULTY_FLAT_WITHOUT_FIXED_FLAG" &&
            i.engineCode === "GT-002" &&
            i.message.includes("BR-LDC-05")
        )
      ).toBe(true);
    });
  });

  describe("checkSkillDifficulties (BR-LDC-04)", () => {
    it("BR-LDC-04: mọi kỹ năng trong corpus đều có ≥2 mức khó", () => {
      const { issues, totalSkills } = checkSkillDifficulties();
      expect(issues).toHaveLength(0);
      expect(totalSkills).toBeGreaterThan(0);
    });

    it("BR-LDC-04: ca âm — kỹ năng chỉ có 1 mức khó bị báo lỗi SKILL_INSUFFICIENT_DIFFICULTY_SPAN", () => {
      const { issues } = checkSkillDifficulties([
        {
          header: {
            code: "GL-C1-CNT-0001",
            template_code: "GT-001",
            difficulty: 2,
            skill_codes: ["C1.CNT.99"],
          },
          difficulty_params: { item_count: 3 },
        },
      ]);
      expect(
        issues.some(
          (i) =>
            i.code === "SKILL_INSUFFICIENT_DIFFICULTY_SPAN" &&
            i.skillCode === "C1.CNT.99" &&
            i.message.includes("BR-LDC-04")
        )
      ).toBe(true);
    });
  });

  describe("checkCorpusLevels & debt management (BR-LDC-01, BR-LDC-02)", () => {
    it("nợ hiện tại nằm trong trần ratchet nên cổng xanh", () => {
      const report = checkDifficultyLadder({ strict: false });
      expect(report.passed).toBe(true);
      expect(report.itemCountMismatches).toBeLessThanOrEqual(
        report.maxItemCountMismatches
      );
      expect(report.levelsMissingItemCount).toBeLessThanOrEqual(
        report.maxLevelsMissingItemCount
      );
    });

    it("ca âm: trần 0 (strict) làm cổng đỏ khi còn nợ", () => {
      const report = checkDifficultyLadder({ strict: true });
      expect(report.passed).toBe(false);
      expect(report.itemCountMismatches).toBeGreaterThan(0);
    });

    it("BR-LDC-02: chỉ đếm là 'đã đối chiếu' những level thực sự khai item_count; thiếu item_count sinh issue", () => {
      const { totalLevelsChecked, levelsMissingItemCount, issues } =
        checkCorpusLevels(validConfig);
      expect(
        issues.filter((i) => i.code === "LEVEL_MISSING_ITEM_COUNT")
      ).toHaveLength(levelsMissingItemCount);
      expect(totalLevelsChecked).toBeGreaterThan(0);
    });

    it("BR-LDC-01: ca âm — engine có trong registry mà thiếu hàng config thì đỏ", () => {
      const withoutRow = {
        ...validConfig,
        engines: Object.fromEntries(
          Object.entries(validConfig.engines).filter(([k]) => k !== "GT-012")
        ),
      } as typeof validConfig;
      const issues = checkConfigLimits(withoutRow);
      expect(
        issues.some(
          (i) => i.code === "MISSING_ENGINE_ROW" && i.engineCode === "GT-012"
        )
      ).toBe(true);
    });
  });

  describe("check-hardcoded-params (BR-LDC-06, BR-LDC-07)", () => {
    it("BR-LDC-06: bỏ qua comment và import khi đếm số cứng trong session.ts", () => {
      const sample = `
// comment 100
/* block 200 */
import { foo } from "bar";
export type Foo = { a: number };
const zero = 0;
const one = 1;
`;
      expect(countHardcodedLinesInCode(sample)).toBe(0);
    });

    it("BR-LDC-06: ca âm — phát hiện các hằng số điều khiển độ khó fix cứng trong session.ts và vượt trần báo đỏ", () => {
      const sample = `
const itemCount = 5;
const timeout = 5000;
`;
      expect(countHardcodedLinesInCode(sample)).toBe(2);
      const result = scanHardcodedParams({ maxAllowedLines: 0 });
      expect(result.passed).toBe(false);
      expect(result.totalLines).toBeGreaterThan(0);
    });

    it("BR-LDC-07: ca dương — cổng check:hardcoded-params xanh và 0 engine gắn .default(...) lên item_count", () => {
      const result = scanHardcodedParams();
      expect(result.passed).toBe(true);
      expect(result.forbiddenDefaultEngines).toEqual([]);
    });

    it("BR-LDC-07: ca âm — phát hiện .default(...) trên trường bắt buộc item_count trong DifficultySchema", () => {
      const sample = `
export const DifficultySchema = z.object({
  item_count: z.number().default(5),
  hint_after_ms: z.number().default(3000),
  allow_retry: z.boolean().default(true),
});
`;
      expect(countSchemaDefaultsInCode(sample)).toBe(3);
      expect(hasForbiddenDifficultyDefault(sample)).toBe(true);

      const validSchemaSample = `
export const DifficultySchema = z.object({
  item_count: z.number().int().min(1),
  allow_retry: z.boolean().default(true),
});
`;
      expect(hasForbiddenDifficultyDefault(validSchemaSample)).toBe(false);
    });
  });

  describe("checkAdaptiveDifficultyBoundary (BR-LDC-08)", () => {
    it("BR-LDC-08: ca dương — packages/adaptive/src/level-params.ts chỉ đọc difficulty_params, không đọc cột difficulty", () => {
      const issues = checkAdaptiveDifficultyBoundary();
      expect(issues).toEqual([]);
    });

    it("BR-LDC-08: ca âm — mã thích ứng đọc base.difficulty hoặc ghi overrides.difficulty thì bị chặn", () => {
      const badSource = `
export function computeAdaptiveParams(base: { difficulty: number; item_count: number }) {
  if (base.difficulty > 3) {
    return { param_overrides: { difficulty: 2 } };
  }
  return { param_overrides: {} };
}
`;
      const issues = checkAdaptiveDifficultyBoundary(badSource);
      expect(issues).toHaveLength(1);
      expect(issues[0]?.code).toBe("ADAPTIVE_READS_DIFFICULTY_COLUMN");
      expect(issues[0]?.message).toContain("BR-LDC-08");
    });
  });
});
