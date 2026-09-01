import { describe, expect, it } from "vitest";
import {
  checkLegacyV1Coverage,
  loadLegacyV1CoverageConfig,
} from "#src/seed-content/gates/legacy-v1-coverage";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";

const EMPTY_ERROR_REGEX = /rỗng/;

describe("Legacy V1 Coverage Gate — Task #170 (WP170.3, BR-LVC-01..05)", () => {
  it("Đọc đúng cấu hình bậc thang legacy-v1-coverage.json", () => {
    const config = loadLegacyV1CoverageConfig();
    expect(config.active_step).toBe(0);
    expect(config.steps.length).toBe(4);
    expect(config.steps[0]?.min_levels_per_type).toBe(1);
    expect(config.steps[0]?.min_types_covered).toBe(20);
    expect(config.steps[1]?.min_types_covered).toBe(51);
    expect(config.steps[2]?.min_types_covered).toBe(57);
    expect(config.steps[3]?.min_types_covered).toBe(60);
  });

  it("Toàn bộ ALL_SEED_LEVELS đạt chuẩn Bậc 0 (≥20 game types có ≥1 level)", () => {
    const report = checkLegacyV1Coverage(ALL_SEED_LEVELS);
    expect(report.activeStep).toBe(0);
    expect(report.totalTypes).toBe(60);
    expect(report.coveredTypesCount).toBeGreaterThanOrEqual(20);
    expect(report.passed).toBe(true);
    expect(report.details.length).toBe(60);
  });

  it("Nguồn dữ liệu rỗng phải ném lỗi, không báo xanh giả", () => {
    expect(() => {
      checkLegacyV1Coverage([]);
    }).toThrow(EMPTY_ERROR_REGEX);
  });

  describe("Ca âm cho WP170.3", () => {
    it("Ca âm 1: Gỡ nhãn legacy_v1_ref làm giảm số types covered xuống dưới ngưỡng -> cổng đỏ", () => {
      const activeLevels = ALL_SEED_LEVELS.filter(
        (l) => l.header.legacy_v1_ref
      );
      const baseReport = checkLegacyV1Coverage(activeLevels);
      // Gỡ nhãn D1-10 khỏi tất cả các level
      const tamperedLevels = activeLevels.map((level) => {
        if (level.header.legacy_v1_ref === "D1-10") {
          return {
            ...level,
            header: {
              ...level.header,
              legacy_v1_ref: undefined,
            },
          };
        }
        return level;
      });

      const report = checkLegacyV1Coverage(tamperedLevels);
      const d110Detail = report.details.find(
        (d) => d.gameType.legacy_id === "D1-10"
      );
      expect(d110Detail?.validLevelCount).toBe(0);
      expect(d110Detail?.isCovered).toBe(false);
      expect(report.coveredTypesCount).toBe(baseReport.coveredTypesCount - 1);
    });

    it("Ca âm 2: Level có nhãn legacy_v1_ref nhưng hỏng content_contract -> không được tính và làm cổng đỏ", () => {
      const activeLevels = ALL_SEED_LEVELS.filter(
        (l) => l.header.legacy_v1_ref
      );
      const baseReport = checkLegacyV1Coverage(activeLevels);
      // Làm hỏng content_pack của các level D1-10
      const tamperedLevels = activeLevels.map((level) => {
        if (level.header.legacy_v1_ref === "D1-10") {
          return {
            ...level,
            content_pack: { invalid: true }, // hỏng schema của GT-028
          };
        }
        return level;
      });

      const report = checkLegacyV1Coverage(tamperedLevels);
      const d110Detail = report.details.find(
        (d) => d.gameType.legacy_id === "D1-10"
      );
      expect(d110Detail?.validLevelCount).toBe(0);
      expect(d110Detail?.isCovered).toBe(false);
      expect(report.coveredTypesCount).toBe(baseReport.coveredTypesCount - 1);
    });
  });
});
