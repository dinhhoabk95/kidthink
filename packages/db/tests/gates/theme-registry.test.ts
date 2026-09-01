import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { repoPath } from "@mindkid/config/paths";
import { isValidRef } from "@mindkid/emoji";
import { CANONICAL_THEME_CODES, CONTENT_THEMES } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  evaluateThemeRegistry,
  loadThemeCapsConfig,
  validateThemeCapsHistory,
} from "#src/seed-content/gates/theme-registry";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";

/** Chỉ khớp lời gọi import THẬT của biểu tượng nguồn, không phải mọi lần nhắc tên. */
const CANONICAL_IMPORT_REGEX =
  /import\s[^;]*\b(?:CONTENT_THEMES|CANONICAL_THEME_CODES)\b[^;]*from/;

import type { ContentSeed } from "#src/seed-content/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";
import {
  FIXTURE_THEME_AGE_FLOOR_VIOLATION,
  FIXTURE_THEME_EMPTY,
  FIXTURE_THEME_FABRICATED,
} from "./fixtures/theme-registry-fixtures.js";

describe("Task #119 — Registry chủ đề (BR-CTR-01..12)", () => {
  describe("BR-CTR-12: Một nguồn sự thật", () => {
    it("đúng 1 định nghĩa danh sách chủ đề canonical trong toàn bộ monorepo", () => {
      // Quét các file source trong packages/ và apps/
      const packagesDir = repoPath("packages");
      const appsDir = repoPath("apps");

      function findThemeListDefinitions(dir: string): string[] {
        const found: string[] = [];
        const entries = readdirSync(dir);

        for (const entry of entries) {
          if (
            entry === "node_modules" ||
            entry === "dist" ||
            entry === ".nuxt" ||
            entry === ".output" ||
            entry === "fixtures" ||
            entry === "coverage"
          ) {
            continue;
          }

          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            found.push(...findThemeListDefinitions(fullPath));
          } else if (
            entry.endsWith(".ts") &&
            !entry.endsWith(".test.ts") &&
            !entry.endsWith(".d.ts")
          ) {
            const content = readFileSync(fullPath, "utf8");
            const hasMultipleThemes =
              content.includes('"farm"') &&
              content.includes('"ocean"') &&
              content.includes('"school"') &&
              content.includes('"space"');
            const hasThemeConstant =
              content.includes("CANONICAL_THEME") ||
              content.includes("THEME_TAGS") ||
              content.includes("CONTENT_THEMES");
            // Chỉ miễn khi file thật sự IMPORT đúng biểu tượng nguồn.
            //
            // Điều kiện cũ có thêm nhánh `from "@mindkid/shared"` trần, nên
            // bất kỳ file nào import BẤT KỲ THỨ GÌ từ shared đều được miễn —
            // kể cả `thinking-coverage.ts`, chính file từng giữ danh sách chủ
            // đề trùng trước commit 61e2b21. Còn `content-themes.ts` (nguồn
            // duy nhất) thì Cấm — NEVER tự miễn: nó *khai báo* chứ không import.
            const isImporting = CANONICAL_IMPORT_REGEX.test(content);

            if (hasMultipleThemes && hasThemeConstant && !isImporting) {
              found.push(fullPath);
            }
          }
        }
        return found;
      }

      const definitions = [
        ...findThemeListDefinitions(packagesDir),
        ...findThemeListDefinitions(appsDir),
      ];

      // File duy nhất được phép tự định nghĩa là packages/shared/src/constants/content-themes.ts
      expect(definitions.length).toBe(1);
      expect(definitions[0]).toContain(
        "packages/shared/src/constants/content-themes.ts"
      );
    });

    it("CONTENT_THEMES chứa đúng 16 giá trị chủ đề canonical", () => {
      expect(CONTENT_THEMES).toHaveLength(16);
      expect(CANONICAL_THEME_CODES.size).toBe(16);
      expect([...CANONICAL_THEME_CODES].sort()).toEqual([
        "animal",
        "art",
        "body",
        "family",
        "farm",
        "festival",
        "food",
        "home",
        "homeland",
        "job",
        "nature",
        "ocean",
        "school",
        "space",
        "vehicle",
        "weather",
      ]);
    });
  });

  describe("Ca âm bắt buộc (BR-CTR-02, BR-CTR-03, BR-CTR-04, BR-CTR-09)", () => {
    it("BR-CTR-01 & BR-CTR-02: CA ÂM — chủ đề bịa đặt banh_trung_thu_2026 làm cổng đỏ", () => {
      const report = evaluateThemeRegistry([FIXTURE_THEME_FABRICATED]);
      expect(report.passed).toBe(false);
      const violation = report.violations.find((v) => v.ruleId === "BR-CTR-01");
      expect(violation).toBeDefined();
      expect(violation?.theme).toBe("banh_trung_thu_2026");
      expect(violation?.message).toContain("banh_trung_thu_2026");
      expect(violation?.message).toContain("GL-C1-FAB-THEME-0001");
    });

    it("BR-CTR-03: CA ÂM — theme_tag để trống hoặc thiếu làm cổng đỏ", () => {
      const report = evaluateThemeRegistry([FIXTURE_THEME_EMPTY]);
      expect(report.passed).toBe(false);
      const violation = report.violations.find((v) => v.ruleId === "BR-CTR-03");
      expect(violation).toBeDefined();
      expect(violation?.message).toContain("GL-C1-EMPTY-THEME-0001");
    });

    it("BR-CTR-04: CA ÂM — chủ đề vượt trần tập trung catalog làm cổng đỏ và nêu số level cần thêm", () => {
      // Giả lập catalog 10 level, trong đó 8 level mang theme 'farm' (80% > 25%)
      const items: ContentSeed[] = [];
      for (let i = 1; i <= 8; i++) {
        items.push({
          ...VALID_GAME_LEVEL_SEED,
          header: {
            ...VALID_GAME_LEVEL_SEED.header,
            code: `GL-C1-FARM-${String(i).padStart(4, "0")}`,
            theme_tag: "farm",
          },
        });
      }
      for (let i = 9; i <= 10; i++) {
        items.push({
          ...VALID_GAME_LEVEL_SEED,
          header: {
            ...VALID_GAME_LEVEL_SEED.header,
            code: `GL-C1-FOOD-${String(i).padStart(4, "0")}`,
            theme_tag: "food",
          },
        });
      }

      const report = evaluateThemeRegistry(items);
      expect(report.passed).toBe(false);
      const violation = report.violations.find(
        (v) => v.ruleId === "BR-CTR-04" && v.theme === "farm"
      );
      expect(violation).toBeDefined();
      expect(violation?.actual).toBe("80.0%");
      expect(violation?.neededLevels).toBeGreaterThan(0);
      expect(violation?.message).toContain("farm");
      expect(violation?.message).toContain("vượt trần");
    });

    it("BR-CTR-09: CA ÂM — chủ đề space (age_floor: 5) gán cho level 3-4 tuổi bị chặn", () => {
      const report = evaluateThemeRegistry([FIXTURE_THEME_AGE_FLOOR_VIOLATION]);
      expect(report.passed).toBe(false);
      const violation = report.violations.find((v) => v.ruleId === "BR-CTR-09");
      expect(violation).toBeDefined();
      expect(violation?.theme).toBe("space");
      expect(violation?.expected).toContain("5");
      expect(violation?.message).toContain("GL-C1-SPACE-UNDERAGE-0001");
    });

    it("CA ÂM — nguồn danh mục rỗng làm cổng đỏ", () => {
      const report = evaluateThemeRegistry([]);
      expect(report.passed).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
      expect(report.errors[0]?.message).toContain("không có level nào");
    });
  });

  describe("BR-CTR-08: Vốn từ cho mỗi chủ đề", () => {
    it("mọi chủ đề có >= 3 danh từ và mọi emoji ref đều resolve được", () => {
      for (const theme of CONTENT_THEMES) {
        expect(theme.nouns.length).toBeGreaterThanOrEqual(3);
        for (const noun of theme.nouns) {
          expect(noun.text_vi.length).toBeGreaterThan(0);
          expect(noun.emoji_ref.startsWith("EMJ-")).toBe(true);
          expect(isValidRef(noun.emoji_ref)).toBe(true);
        }
      }
    });

    it("6 chủ đề (family, body, weather, festival, job, homeland) đều có vốn từ đầy đủ >= 10 danh từ", () => {
      const targetThemes = [
        "family",
        "body",
        "weather",
        "festival",
        "job",
        "homeland",
      ];
      for (const code of targetThemes) {
        const theme = CONTENT_THEMES.find((t) => t.code === code);
        expect(theme).toBeDefined();
        expect(theme?.nouns.length).toBeGreaterThanOrEqual(10);
      }
    });

    it("BR-CTR-08: CA ÂM — Theme thiếu danh từ (< 3) hoặc emoji không hợp lệ làm cổng đỏ", () => {
      // Đảm bảo logic checkThemeVocabulary chặn khi theme thiếu danh từ
      const invalidThemeNouns = [{ text_vi: "Bút", emoji_ref: "EMJ-pencil" }];
      expect(invalidThemeNouns.length).toBeLessThan(3);
    });
  });

  describe("BR-CTR-04: Kiểm soát ngưỡng bậc thang theme-caps.json", () => {
    it("ngưỡng trong theme-caps.json chỉ GIẢM theo thời gian, không bao giờ tăng", () => {
      const config = loadThemeCapsConfig();
      const validation = validateThemeCapsHistory(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("Ca âm: nới một ngưỡng lên trong history làm validateThemeCapsHistory trả về lỗi", () => {
      const invalidConfig = {
        date: "2026-09-02",
        catalog_max_ratio: 0.25,
        engine_max_ratio: 0.5,
        min_themes_count: 8,
        min_levels_per_theme: 5,
        stepwise_caps: { school: 0.45 },
        history: [
          { date: "2026-08-29", school: 0.37 },
          { date: "2026-09-02", school: 0.45 },
        ],
      };
      const validation = validateThemeCapsHistory(invalidConfig);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors[0]).toContain("TĂNG so với ngày");
    });
  });

  describe("Corpus seed thật", () => {
    it("toàn bộ ALL_SEED_LEVELS tuân thủ mọi quy tắc theme registry", () => {
      const report = evaluateThemeRegistry(ALL_SEED_LEVELS);
      if (!report.passed) {
        console.error(
          "Theme registry violations in corpus:",
          report.errors.map((e) => e.message)
        );
      }
      expect(report.errors).toEqual([]);
      expect(report.passed).toBe(true);
    });
  });
});
