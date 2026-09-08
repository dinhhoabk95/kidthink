import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type EngineDifficultyParamsConfig,
  EngineDifficultyParamsConfigSchema,
} from "../src/contracts/engine-difficulty-config.js";
import { ALL_TEMPLATES } from "../src/generated/template-registry.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.resolve(
  HERE,
  "../config/engine-difficulty-params.json"
);

describe("Hợp đồng độ khó engine-difficulty-params.json (Task #263 T5)", () => {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw) as unknown;

  it("file JSON parse hợp lệ qua EngineDifficultyParamsConfigSchema", () => {
    const validated = EngineDifficultyParamsConfigSchema.parse(parsed);
    expect(validated).toBeDefined();
  });

  it("có đủ 37 engine GT-000..GT-036 trong cấu hình", () => {
    const config = parsed as EngineDifficultyParamsConfig;
    const configKeys = Object.keys(config.engines).sort();
    const templateKeys = Object.keys(ALL_TEMPLATES).sort();

    expect(configKeys).toEqual(templateKeys);
    expect(configKeys).toHaveLength(37);
  });

  it("mỗi engine có reason hợp lệ và có đủ 5 mức khó", () => {
    const config = parsed as EngineDifficultyParamsConfig;
    for (const [code, entry] of Object.entries(config.engines)) {
      expect(entry.reason, `${code} thiếu reason`).toBeDefined();
      expect(
        entry.reason.length,
        `${code} reason quá ngắn`
      ).toBeGreaterThanOrEqual(10);
      expect(Object.keys(entry.levels).sort()).toEqual([
        "1",
        "2",
        "3",
        "4",
        "5",
      ]);
    }
  });

  it("mỗi ô item_count nằm trong limits.item_count của template", () => {
    const config = parsed as EngineDifficultyParamsConfig;
    for (const [code, entry] of Object.entries(config.engines)) {
      const template = ALL_TEMPLATES[code];
      expect(template, `Không tìm thấy template ${code}`).toBeDefined();
      if (!template) {
        continue;
      }
      const [minLimit, maxLimit] = template.limits.item_count;

      for (let lvl = 1; lvl <= 5; lvl++) {
        const params = entry.levels[String(lvl) as "1" | "2" | "3" | "4" | "5"];
        expect(
          params.item_count,
          `${code} mức ${lvl} có item_count=${params.item_count} nhỏ hơn limits.min=${minLimit}`
        ).toBeGreaterThanOrEqual(minLimit);
        expect(
          params.item_count,
          `${code} mức ${lvl} có item_count=${params.item_count} lớn hơn limits.max=${maxLimit}`
        ).toBeLessThanOrEqual(maxLimit);
      }
    }
  });

  it("số item không giảm khi mức khó tăng (đơn điệu không giảm)", () => {
    const config = parsed as EngineDifficultyParamsConfig;
    for (const [code, entry] of Object.entries(config.engines)) {
      for (let lvl = 1; lvl < 5; lvl++) {
        const cur = entry.levels[String(lvl) as "1" | "2" | "3" | "4" | "5"];
        const next =
          entry.levels[String(lvl + 1) as "1" | "2" | "3" | "4" | "5"];
        expect(
          next.item_count,
          `${code} mức ${lvl + 1} (${next.item_count}) nhỏ hơn mức ${lvl} (${cur.item_count})`
        ).toBeGreaterThanOrEqual(cur.item_count);
      }
    }
  });

  it("ngoại lệ difficulty_fixed được khai báo có chủ ý", () => {
    const config = parsed as EngineDifficultyParamsConfig;
    expect(config.engines["GT-000"]?.difficulty_fixed).toBe(true);
    expect(config.engines["GT-013"]?.difficulty_fixed).toBe(true);
  });
});
