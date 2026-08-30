import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import {
  type EngineDepthConfig,
  evaluateEngineDepth,
  formatEngineDepthReport,
  loadEngineDepthConfig,
  validateEngineDepthHistory,
} from "#src/seed-content/gates/engine-content-depth";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";
import type { ContentSeed } from "#src/seed-content/types";
import { SAMPLE_LEVEL_SEED } from "./fixtures/engine-depth-fixtures.js";

const ERR_HISTORY_DOWNGRADE = /Bậc thang một chiều/;
const ERR_EMPTY_SOURCE = /Nguồn corpus seed rỗng hoặc không đọc được/;

describe("Sàn chiều sâu mỗi engine — Task #122 (BR-ECD-01..13)", () => {
  it("Bậc 0: toàn bộ 27 engine active đều đạt sàn baseline", () => {
    const config = loadEngineDepthConfig();
    expect(config.active_step).toBe(0);

    const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);
    expect(report.passed).toBe(true);
    expect(report.totalEngines).toBe(27);
    expect(report.passedEnginesCount).toBe(27);
    expect(report.failedEnginesCount).toBe(0);
    expect(report.violations.length).toBe(0);
  });

  it("Scenario: BR-ECD-10 — báo cáo không chứa phần trăm tổng (%)", () => {
    const config = loadEngineDepthConfig();
    const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);
    const formatted = formatEngineDepthReport(report);

    expect(formatted).not.toContain("%");
    expect(formatted).toContain("check:engine-depth");
    expect(formatted).toContain("27 engine active");
  });

  it("Scenario: Cổng không mở kết nối database (DATABASE_URL trỏ host giả)", () => {
    const origUrl = process.env.DATABASE_URL;
    try {
      process.env.DATABASE_URL =
        "postgres://fake:fake@nonexistent.domain.local:5432/fake";
      const config = loadEngineDepthConfig();
      const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);
      expect(report.passed).toBe(true);
    } finally {
      process.env.DATABASE_URL = origUrl;
    }
  });

  describe("Ca âm bắt buộc (WP122.1 & WP122.4)", () => {
    it("Ca âm 1: bớt 1 level của engine sát sàn ở bậc 0 → cổng đỏ (BR-ECD-11, BR-ECD-01)", () => {
      const config = loadEngineDepthConfig();
      // GT-009 chỉ có 3 level ở seed hiện tại. Lọc bỏ 1 level của GT-009:
      let removed = false;
      const reducedLevels = ALL_SEED_LEVELS.filter((l) => {
        if (!removed && l.header.template_code === "GT-009") {
          removed = true;
          return false;
        }
        return true;
      });

      const report = evaluateEngineDepth(reducedLevels, config);
      expect(report.passed).toBe(false);
      expect(
        report.violations.some(
          (v) => v.engine === "GT-009" && v.ruleId === "BR-ECD-01"
        )
      ).toBe(true);
    });

    it("Ca âm 2: dồn cả 6 level vào 1 band khi bậc 1 đòi ≥1 mỗi band hợp lệ → đỏ ở min_band_count (BR-ECD-02)", () => {
      const step1Config: EngineDepthConfig = {
        active_step: 1,
        date: "2026-08-30",
        history: [
          { step: 0, date: "2026-08-30" },
          { step: 1, date: "2026-08-30" },
        ],
        steps: {
          "1": {
            level_count: 6,
            min_band_count: 1,
            thinking_span: 2,
            what_span: 2,
            theme_span: 2,
            difficulty_span: 2,
            min_free_or_login: 1,
          },
        },
      };

      // Tạo 6 level cùng band 3-4 cho GT-001
      const stackedLevels: ContentSeed<unknown, unknown>[] = [];
      for (let i = 1; i <= 6; i++) {
        stackedLevels.push({
          ...SAMPLE_LEVEL_SEED,
          header: {
            ...SAMPLE_LEVEL_SEED.header,
            code: `GL-C1-STACK-${i}`,
            template_code: "GT-001",
            age_min: 3,
            age_max: 4,
            thinking_tags: [`think_${i}`],
            what_tags: [`what_${i}`],
            theme_tag: `theme_${i}`,
            difficulty: i,
            access_tier: "free",
          },
        });
      }

      const tmpl = ALL_TEMPLATES["GT-001"];
      if (!tmpl) {
        throw new Error("Template GT-001 missing");
      }
      const singleTemplate = { "GT-001": tmpl };

      const report = evaluateEngineDepth(
        stackedLevels,
        step1Config,
        singleTemplate as any
      );
      expect(report.passed).toBe(false);
      expect(
        report.violations.some(
          (v) => v.engine === "GT-001" && v.ruleId === "BR-ECD-02"
        )
      ).toBe(true);
    });

    it("Ca âm 3: thinking_span = 1 khi bậc 1 đòi ≥2 → đỏ (BR-ECD-03)", () => {
      const step1Config: EngineDepthConfig = {
        active_step: 1,
        date: "2026-08-30",
        history: [
          { step: 0, date: "2026-08-30" },
          { step: 1, date: "2026-08-30" },
        ],
        steps: {
          "1": {
            level_count: 6,
            min_band_count: 1,
            thinking_span: 2,
            what_span: 2,
            theme_span: 2,
            difficulty_span: 2,
            min_free_or_login: 1,
          },
        },
      };

      // Tạo 6 level trải đều 3 band nhưng chỉ có đúng 1 thinking tag: "compare"
      const monoThinkingLevels: ContentSeed<unknown, unknown>[] = [];
      const bands = [
        { min: 3, max: 4 },
        { min: 4, max: 5 },
        { min: 5, max: 6 },
      ];
      for (let i = 1; i <= 6; i++) {
        const b = bands[i % 3] || { min: 3, max: 4 };
        monoThinkingLevels.push({
          ...SAMPLE_LEVEL_SEED,
          header: {
            ...SAMPLE_LEVEL_SEED.header,
            code: `GL-C1-THINK-${i}`,
            template_code: "GT-001",
            age_min: b.min,
            age_max: b.max,
            thinking_tags: ["compare"], // 1 giá trị duy nhất
            what_tags: [`what_${i}`],
            theme_tag: `theme_${i}`,
            difficulty: i,
            access_tier: "free",
          },
        });
      }

      const tmpl = ALL_TEMPLATES["GT-001"];
      if (!tmpl) {
        throw new Error("Template GT-001 missing");
      }
      const singleTemplate = { "GT-001": tmpl };

      const report = evaluateEngineDepth(
        monoThinkingLevels,
        step1Config,
        singleTemplate as any
      );
      expect(report.passed).toBe(false);
      expect(
        report.violations.some(
          (v) => v.engine === "GT-001" && v.ruleId === "BR-ECD-03"
        )
      ).toBe(true);
    });

    it("Ca âm 4: hạ bậc trong engine-depth.json → ném lỗi bậc thang một chiều (BR-ECD-08)", () => {
      const downgradedConfig: EngineDepthConfig = {
        active_step: 0,
        date: "2026-08-30",
        history: [
          { step: 0, date: "2026-08-29" },
          { step: 1, date: "2026-08-30" }, // Lịch sử đã lên 1 nhưng active_step bị hạ về 0
        ],
        steps: {
          "0": {
            level_count: 3,
            min_band_count: 0,
            thinking_span: 1,
            what_span: 1,
            theme_span: 1,
            difficulty_span: 1,
            min_free_or_login: 0,
          },
        },
      };

      expect(() => {
        validateEngineDepthHistory(downgradedConfig);
      }).toThrow(ERR_HISTORY_DOWNGRADE);
    });

    it("Ca âm 5: nguồn rỗng → dừng với lỗi (BR-ECD-11)", () => {
      const config = loadEngineDepthConfig();
      expect(() => {
        evaluateEngineDepth([], config);
      }).toThrow(ERR_EMPTY_SOURCE);
    });
  });

  describe("WP122.2 & WP122.3: Bảng phân bổ 55 level bậc 1 cho 27 task engine", () => {
    it("đo phân bổ thiếu chính xác 55 level trên 27 engine cho bậc 1", () => {
      const step1Config: EngineDepthConfig = {
        active_step: 1,
        date: "2026-08-30",
        history: [
          { step: 0, date: "2026-08-30" },
          { step: 1, date: "2026-08-30" },
        ],
        steps: {
          "1": {
            level_count: 6,
            min_band_count: 1,
            thinking_span: 2,
            what_span: 2,
            theme_span: 2,
            difficulty_span: 2,
            min_free_or_login: 1,
          },
        },
      };

      const report = evaluateEngineDepth(ALL_SEED_LEVELS, step1Config);
      let totalLevelsDeficit = 0;

      for (const [code, info] of Object.entries(report.perEngine)) {
        totalLevelsDeficit += info.deficits.level_count;
        if (
          [
            "GT-001",
            "GT-002",
            "GT-003",
            "GT-004",
            "GT-005",
            "GT-006",
            "GT-007",
            "GT-008",
          ].includes(code)
        ) {
          expect(info.deficits.level_count, `${code} đã có ≥6 level`).toBe(0);
        } else if (["GT-012", "GT-025"].includes(code)) {
          expect(
            info.deficits.level_count,
            `${code} đang có 4 level, thiếu 2`
          ).toBe(2);
        } else {
          expect(
            info.deficits.level_count,
            `${code} đang có 3 level, thiếu 3`
          ).toBe(3);
        }
      }

      // Tổng deficit level_count đúng bằng 55: (2 engine * 2) + (17 engine * 3) = 4 + 51 = 55
      expect(totalLevelsDeficit).toBe(55);
    });
  });
});
