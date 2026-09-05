import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  type EngineDepthConfig,
  evaluateEngineDepth,
  formatEngineDepthReport,
  loadEngineDepthConfig,
  validateEngineDepthHistory,
} from "#src/gates/engine-content-depth";
import { ALL_SEED_LEVELS } from "#src/index";
import type { ContentSeed } from "#src/types";
import { SAMPLE_LEVEL_SEED } from "./fixtures/engine-depth-fixtures.js";

const ERR_HISTORY_DOWNGRADE = /Bậc thang một chiều/;
const ERR_EMPTY_SOURCE = /Nguồn corpus seed rỗng hoặc không đọc được/;

/**
 * Tổng thiếu hụt `level_count` ở bậc 1, đo 2026-08-30 trên corpus thật.
 *
 * 55 → 52 sau khi soạn thêm 8 level band 3-4 để đóng `BR-TCL-04`/`BR-TCM-04`.
 * 52 → 48 sau khi bổ sung level chuẩn hoá cho các template.
 * 48 → 45 sau khi soạn lại 73 level cách ly (task 162): chúng rời `GT-004`,
 *   `GT-005`, `GT-006`, `GT-011` — nơi chúng từng được **đếm mà không chơi
 *   được** — và phân lại theo cơ chế thật, đồng thời nâng `GT-004` và `GT-006`
 *   lên sàn bậc 1.
 * Số chỉ được GIẢM: tăng nghĩa là ai đó xoá level hoặc thêm engine chưa có nội dung.
 */
const MAX_LEVEL_COUNT_DEFICIT_AT_STEP_1 = 45;

describe("Sàn chiều sâu mỗi engine — Task #122 (BR-ECD-01..13)", () => {
  it("Bậc 0: toàn bộ 36 engine active đều đạt sàn baseline", () => {
    const config = loadEngineDepthConfig();
    expect(config.active_step).toBe(0);

    const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);
    expect(report.passed).toBe(true);
    expect(report.totalEngines).toBe(Object.keys(ALL_TEMPLATES).length);
    expect(report.passedEnginesCount).toBe(Object.keys(ALL_TEMPLATES).length);
    expect(report.failedEnginesCount).toBe(0);
    expect(report.violations.length).toBe(0);
  });

  it("Scenario: BR-ECD-10 — báo cáo không chứa phần trăm tổng (%)", () => {
    const config = loadEngineDepthConfig();
    const report = evaluateEngineDepth(ALL_SEED_LEVELS, config);
    const formatted = formatEngineDepthReport(report);

    expect(formatted).not.toContain("%");
    expect(formatted).toContain("check:engine-depth");
    expect(formatted).toContain(`${report.totalEngines} engine active`);
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
    it("Ca âm 1: bớt level của engine sát sàn ở bậc 0 (còn 2 level) → cổng đỏ (BR-ECD-11, BR-ECD-01)", () => {
      const config = loadEngineDepthConfig();
      // Giữ chỉ 2 level cho GT-009 (sàn bậc 0 yêu cầu >= 3):
      let keepCount = 0;
      const reducedLevels = ALL_SEED_LEVELS.filter((l) => {
        if (l.header.template_code === "GT-009") {
          keepCount++;
          return keepCount <= 2;
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
        // Thiếu hụt ❌ NEVER âm: một engine vượt sàn thì thiếu hụt là 0, không
        // phải số âm bù trừ cho engine khác.
        expect(
          info.deficits.level_count,
          `${code} thiếu hụt âm`
        ).toBeGreaterThanOrEqual(0);
      }

      // Bậc thang tổng: chỉ được GIẢM. Phân hoạch cứng theo tên engine như bản
      // trước ("GT-012 và GT-025 thiếu 2, còn lại thiếu 3") biến mọi lần soạn
      // thêm level — kể cả đúng hướng — thành một test đỏ phải sửa tay, nên nó
      // đo danh sách tên chứ không đo tiến độ.
      expect(totalLevelsDeficit).toBeLessThanOrEqual(
        MAX_LEVEL_COUNT_DEFICIT_AT_STEP_1
      );
    });
  });
});
