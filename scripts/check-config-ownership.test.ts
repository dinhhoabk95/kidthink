/**
 * Kiểm thử cổng sở hữu cấu hình (`BR-CFO-01..12`).
 *
 * Mỗi luật có ĐỦ ca âm và ca dương theo tiêu chuẩn dự án.
 * Invariant: Strict TypeScript — NO `any`, NO `unknown`.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type ConfigViolation,
  scanConfigOwnership,
} from "./check-config-ownership.js";

describe("Cổng check:config-ownership", () => {
  it("ca dương: hệ thống hiện tại khớp baseline 100% không vi phạm", () => {
    const { stats, violations, baseline } = scanConfigOwnership();

    expect(violations).toEqual([]);
    expect(stats.duplicate_config_files).toBe(baseline.duplicate_config_files);
    expect(stats.duplicate_constant_values).toBe(
      baseline.duplicate_constant_values
    );
    expect(stats.age_band_declarations).toBe(baseline.age_band_declarations);
    expect(stats.touch_floor_declarations).toBe(
      baseline.touch_floor_declarations
    );
    expect(stats.token_source_count).toBe(baseline.token_source_count);
    expect(stats.orphan_check_scripts).toBe(baseline.orphan_check_scripts);
    expect(stats.commented_lefthook_blocks).toBe(
      baseline.commented_lefthook_blocks
    );
  });

  describe("Ca âm cho từng luật BR-CFO-01..12", () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "check-config-ownership-test-")
      );
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    function setupMinimalRepo(): void {
      fs.mkdirSync(path.join(tempDir, "packages/config/src"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(tempDir, "packages/shared/src"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(tempDir, "packages/storage/src"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(tempDir, "packages/adaptive/src"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(tempDir, "packages/game-engine/src/systems"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(tempDir, "packages/db/config"), {
        recursive: true,
      });
      fs.mkdirSync(
        path.join(tempDir, "packages/content-build/src/thresholds"),
        { recursive: true }
      );
      fs.mkdirSync(path.join(tempDir, "apps/web"), { recursive: true });
      fs.mkdirSync(path.join(tempDir, "scripts"), { recursive: true });

      // Valid defaults
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({
          scripts: {
            "check:valid": "tsx scripts/check-valid.ts",
          },
        })
      );
      fs.writeFileSync(
        path.join(tempDir, "scripts/check.sh"),
        "pnpm check:valid\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "lefthook.yml"),
        "pre-commit:\n  jobs:\n    - name: engine-gates\n      # ⚠️ Điểm mù\n      glob: 'foo/**'\npre-push:\n  jobs:\n    - name: check\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "packages/config/src/index.ts"),
        "export * from './backup.js';\nexport * from './repo-paths.js';\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "packages/shared/src/age-bands.ts"),
        "export const AGE_BANDS = ['3-4', '4-5', '5-6'] as const;\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "packages/shared/src/touch-floors.ts"),
        "export const TOUCH_FLOORS = { '3-4': 96, '4-5': 72, '5-6': 72 } as const;\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "packages/game-engine/src/systems/designTokens.ts"),
        "export const surface = { 500: '#78716c' };\nexport const fonts = { sans: 'Be Vietnam Pro', heading: 'Baloo 2' };\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "packages/adaptive/src/level-params.ts"),
        "const LOW_MASTERY_THRESHOLD = 0.4;\nif (p_learn < LOW_MASTERY_THRESHOLD) {}\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "apps/web/nuxt.config.ts"),
        "export default defineNuxtConfig({ runtimeConfig: { session: {}, public: { apiBaseUrl: '' } } });\n"
      );
      fs.writeFileSync(
        path.join(tempDir, "scripts/config-ownership-baseline.json"),
        JSON.stringify({
          duplicate_config_files: 0,
          duplicate_constant_values: 0,
          age_band_declarations: 1,
          touch_floor_declarations: 1,
          token_source_count: 1,
          orphan_check_scripts: 0,
          commented_lefthook_blocks: 0,
        })
      );
    }

    it("BR-CFO-01: phát hiện khai báo hằng số trùng ở package thứ hai", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "packages/storage/src/index.ts"),
        "export const PROOF_SIGNED_URL_TTL_MINUTES = 15;\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.duplicate_constant_values).toBeGreaterThan(0);
      expect(
        res.violations.some(
          (v: ConfigViolation) =>
            v.rule === "BR-CFO-01" &&
            v.target === "packages/storage/src/index.ts"
        )
      ).toBe(true);
    });

    it("BR-CFO-02: phát hiện hai file cấu hình trùng byte không phải symlink", () => {
      setupMinimalRepo();
      const content = JSON.stringify({ key: "value" });
      fs.writeFileSync(
        path.join(tempDir, "packages/db/config/depth.json"),
        content
      );
      fs.writeFileSync(
        path.join(tempDir, "packages/content-build/src/thresholds/depth.json"),
        content
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.duplicate_config_files).toBeGreaterThan(0);
      expect(
        res.violations.some(
          (v: ConfigViolation) =>
            v.rule === "BR-CFO-02" &&
            v.target === "packages/db/config/depth.json"
        )
      ).toBe(true);
    });

    it("BR-CFO-04: phát hiện số trần so sánh trong thân hàm adaptive", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "packages/adaptive/src/level-params.ts"),
        "export function test(p_learn: number) { if (p_learn < 0.4) return 1; }\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-04")
      ).toBe(true);
    });

    it("BR-CFO-05: phát hiện barrel config thiếu export backup hoặc repo-paths", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "packages/config/src/index.ts"),
        "export const a = 1;\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-05")
      ).toBe(true);
    });

    it("BR-CFO-06: phát hiện khai báo band tuổi độc lập ngoài packages/shared", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "apps/web/component.vue"),
        '<script setup lang="ts">\ntype LocalAge = "3-4" | "4-5" | "5-6";\n</script>\n'
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.age_band_declarations).toBeGreaterThan(1);
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-06")
      ).toBe(true);
    });

    it("BR-CFO-07: phát hiện khai báo sàn chạm độc lập MIN_TOUCH_PX", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "packages/game-engine/src/interaction.ts"),
        "export const MIN_TOUCH_PX = 64;\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.touch_floor_declarations).toBeGreaterThan(1);
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-07")
      ).toBe(true);
    });

    it("BR-CFO-08: phát hiện token màu surface lệch hoặc phông chưa nạp", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "packages/game-engine/src/systems/designTokens.ts"),
        "export const surface = { 500: '#827660' };\nexport const fonts = { sans: 'Quicksand' };\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.token_source_count).toBe(2);
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-08")
      ).toBe(true);
    });

    it("BR-CFO-09: phát hiện script check:* mồ côi không có call site", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({
          scripts: {
            "check:orphan-gate": "tsx scripts/check-orphan.ts",
          },
        })
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.orphan_check_scripts).toBeGreaterThan(0);
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-09")
      ).toBe(true);
    });

    it("BR-CFO-10: phát hiện job engine-gates thiếu chú thích điểm mù", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "lefthook.yml"),
        "pre-commit:\n  jobs:\n    - name: engine-gates\n      glob: 'foo/**'\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-10")
      ).toBe(true);
    });

    it("BR-CFO-11: phát hiện khối pre-push bị comment hoàn toàn", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "lefthook.yml"),
        "pre-commit:\n  jobs: []\n# pre-push:\n#   parallel: false\n#   jobs:\n#     - name: check\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(res.stats.commented_lefthook_blocks).toBeGreaterThan(0);
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-11")
      ).toBe(true);
    });

    it("BR-CFO-12: phát hiện thiếu runtimeConfig.public trong apps/web", () => {
      setupMinimalRepo();
      fs.writeFileSync(
        path.join(tempDir, "apps/web/nuxt.config.ts"),
        "export default defineNuxtConfig({ runtimeConfig: { session: {} } });\n"
      );

      const res = scanConfigOwnership({ repoRoot: tempDir });
      expect(
        res.violations.some((v: ConfigViolation) => v.rule === "BR-CFO-12")
      ).toBe(true);
    });
  });
});
