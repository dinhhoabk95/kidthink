import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  checkConfigLimits,
  checkConfigMonotonicity,
  checkCorpusLevels,
  checkDifficultyLadder,
  checkSkillDifficulties,
} from "../scripts/check-difficulty-ladder.js";
import {
  countHardcodedLinesInCode,
  countSchemaDefaultsInCode,
} from "../scripts/check-hardcoded-params.js";
import {
  type EngineDifficultyParamsConfig,
  EngineDifficultyParamsConfigSchema,
} from "../src/contracts/engine-difficulty-config.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(
  HERE,
  "../config/engine-difficulty-params.json"
);

describe("Cổng check:difficulty-ladder và check:hardcoded-params (Task #263 T6 / BR-LDC-01..06)", () => {
  const rawConfig = fs.readFileSync(CONFIG_PATH, "utf-8");
  const validConfig = EngineDifficultyParamsConfigSchema.parse(
    JSON.parse(rawConfig)
  ) as EngineDifficultyParamsConfig;

  describe("checkConfigLimits", () => {
    it("pass trên cấu hình chuẩn engine-difficulty-params.json", () => {
      const issues = checkConfigLimits(validConfig);
      expect(issues).toHaveLength(0);
    });

    it("bắt lỗi khi item_count vượt trần maxLimit của template", () => {
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

    it("bắt lỗi khi item_count nhỏ hơn sàn minLimit của template", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      // GT-001 limits là [2, 6]. Gán mức 1 = 1 -> vi phạm
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

  describe("checkConfigMonotonicity", () => {
    it("pass trên cấu hình chuẩn engine-difficulty-params.json", () => {
      const issues = checkConfigMonotonicity(validConfig);
      expect(issues).toHaveLength(0);
    });

    it("bắt lỗi khi item_count giảm khi độ khó tăng (descending)", () => {
      const cloned = JSON.parse(
        JSON.stringify(validConfig)
      ) as EngineDifficultyParamsConfig;
      // Gán mức 3 nhỏ hơn mức 2
      const gt1 = cloned.engines["GT-001"];
      if (gt1?.levels["3"] && gt1?.levels["2"]) {
        gt1.levels["3"].item_count = 2;
        gt1.levels["2"].item_count = 4;
      }

      const issues = checkConfigMonotonicity(cloned);
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(
        issues.some((i) => i.code === "DIFFICULTY_ITEM_COUNT_DESCENDING")
      ).toBe(true);
      expect(issues.some((i) => i.engineCode === "GT-001")).toBe(true);
    });
  });

  describe("checkSkillDifficulties", () => {
    it("tất cả 443 kỹ năng trong corpus đều có ≥2 mức khó", () => {
      const issues = checkSkillDifficulties();
      expect(issues).toHaveLength(0);
    });
  });

  describe("checkCorpusLevels & debt management", () => {
    it("chế độ baseline nợ cho phép pass toàn bộ cổng", () => {
      const report = checkDifficultyLadder({ strict: false });
      expect(report.passed).toBe(true);
      expect(report.issues).toHaveLength(0);
    });

    it("chế độ strict phát hiện sai lệch ở các engine nợ kỹ thuật", () => {
      const report = checkDifficultyLadder({ strict: true });
      expect(report.passed).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(
        report.issues.some((i) => i.code === "LEVEL_ITEM_COUNT_MISMATCH")
      ).toBe(true);
    });

    it("phát hiện sai lệch ở engine không thuộc danh sách nợ", () => {
      // GT-012 có level chứa item_count trong corpus. Nếu không đưa GT-012 vào debtEngines, cổng sẽ báo lỗi.
      const { issues } = checkCorpusLevels(
        validConfig,
        new Set(["GT-001"]),
        false
      );
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues.some((i) => i.engineCode === "GT-012")).toBe(true);
    });
  });

  describe("countHardcodedLinesInCode (check-hardcoded-params)", () => {
    it("bỏ qua comment và import", () => {
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

    it("phát hiện các hằng số không tầm thường", () => {
      const sample = `
const itemCount = 5;
const timeout = 5000;
`;
      expect(countHardcodedLinesInCode(sample)).toBe(2);
    });

    it("đếm chính xác các .default(...) trong DifficultySchema", () => {
      const sample = `
export const DifficultySchema = z.object({
  item_count: z.number().default(5),
  hint_after_ms: z.number().default(3000),
  allow_retry: z.boolean().default(true),
});
`;
      expect(countSchemaDefaultsInCode(sample)).toBe(3);
    });
  });
});
