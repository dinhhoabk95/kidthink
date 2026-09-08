import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ERR_EMPTY_SOURCE,
  ERR_MISSING_SECTION_13,
  ERR_MISSING_TABLE,
  ERR_MISSING_TAG_COLUMNS,
  ERR_MISSING_VALID_BAND,
  ERR_NON_NUMERIC_CELL,
  evaluateEngineSeedMatrix,
  formatSeedMatrixReport,
  loadSeedMatrixBaseline,
  parseSeedMatrixFromSpec,
  type SeedMatrixBaselineConfig,
} from "../../src/gates/engine-seed-matrix.js";
import { ALL_SEED_LEVELS } from "../../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../../");
const specsDir = path.join(repoRoot, "docs/specs/01-platform/engines");

describe("Cổng check:engine-seed-matrix — Task #263 T13", () => {
  it("Khảo sát chuẩn: quét 37 phiếu, 241 ô có mục tiêu, đúng 49 ô thủng trên 26 engine", () => {
    const baseline = loadSeedMatrixBaseline();
    const report = evaluateEngineSeedMatrix(
      ALL_SEED_LEVELS,
      specsDir,
      baseline
    );

    expect(report.totalEngines).toBe(37);
    expect(report.totalTargetCells).toBe(241);
    expect(report.totalHoles).toBe(49);
    expect(report.passed).toBe(true);
    expect(report.newHoles.length).toBe(0);

    const enginesWithHoles = new Set(report.deficits.map((d) => d.engine));
    expect(enginesWithHoles.size).toBe(26);

    const formatted = formatSeedMatrixReport(report);
    expect(formatted).toContain("CHECK:ENGINE-SEED-MATRIX");
    expect(formatted).toContain("Tổng số ô có mục tiêu: 241");
    expect(formatted).toContain("Số ô thủng: 49");
    expect(formatted).toContain("GT-030 5-6 count: có 0, cần 4");
    expect(formatted).toContain("GT-031 5-6 solve: có 0, cần 4");
    expect(formatted).toContain("GT-033 5-6 sequence: có 0, cần 4");
  });

  it("Ca âm 1: bảng thiếu cột tag → ném lỗi (ERR_MISSING_TAG_COLUMNS)", () => {
    const invalidSpec = `
# GT-099 — Test Engine

## 13. Ma trận seed mục tiêu

| Band | Tổng mục tiêu |
|---|:--:|
| \`3-4\` | ≥4 |

## 14. Ca sai
`;
    expect(() => {
      parseSeedMatrixFromSpec(invalidSpec, "GT-099");
    }).toThrow(ERR_MISSING_TAG_COLUMNS);
  });

  it("Ca âm 2: ô ghi chữ thay số → ném lỗi (ERR_NON_NUMERIC_CELL)", () => {
    const invalidSpec = `
# GT-099 — Test Engine

## 13. Ma trận seed mục tiêu

| Band | \`observe\` | \`count\` | Tổng mục tiêu |
|---|:--:|:--:|:--:|
| \`3-4\` | ≥3 | nhiều | ≥4 |

## 14. Ca sai
`;
    expect(() => {
      parseSeedMatrixFromSpec(invalidSpec, "GT-099");
    }).toThrow(ERR_NON_NUMERIC_CELL);
  });

  it("Ca âm 3: bảng thiếu một band hợp lệ của engine → ném lỗi (ERR_MISSING_VALID_BAND)", () => {
    const mockTemplate = {
      code: "GT-001",
      name: "Chạm chọn",
      mechanic: "tap-select",
      status: "published",
      version: 1,
      engine_session: "TapSelectSession",
      layouts: ["grid"],
      content_contract: {} as never,
      difficulty_contract: {} as never,
      age_min: 3,
      age_max: 6,
      banned_age_bands: [],
      requires_tap_fallback: false,
      limits: { item_count: [2, 6] as [number, number] },
      asset_kinds: ["emoji"],
      scoring: {} as never,
      input: { family: "tap", verbs: ["tap"] } as never,
      events: [],
    };

    // GT-001 hợp lệ cả 3 band (3-4, 4-5, 5-6), nhưng spec giả chỉ khai band 3-4
    const incompleteSpec = `
# GT-001 — Chạm chọn

## 13. Ma trận seed mục tiêu

| Band | \`observe\` | \`count\` | Tổng mục tiêu |
|---|:--:|:--:|:--:|
| \`3-4\` | ≥3 | ≥2 | ≥5 |

## 14. Ca sai
`;
    expect(() => {
      parseSeedMatrixFromSpec(incompleteSpec, "GT-001", mockTemplate);
    }).toThrow(ERR_MISSING_VALID_BAND);
  });

  it("Ca âm 4: xuất hiện ô thủng mới ngoài baseline → report.passed = false (Ratchet)", () => {
    // Giả lập baseline chỉ chấp nhận 48 ô thủng (bỏ ô GT-003 5-6 sort)
    const baseline = loadSeedMatrixBaseline();
    const restrictedBaseline: SeedMatrixBaselineConfig = {
      ...baseline,
      baseline_deficits: baseline.baseline_deficits.filter(
        (d) => !(d.engine === "GT-003" && d.band === "5-6" && d.tag === "sort")
      ),
    };

    const report = evaluateEngineSeedMatrix(
      ALL_SEED_LEVELS,
      specsDir,
      restrictedBaseline
    );
    expect(report.passed).toBe(false);
    expect(report.newHoles.length).toBeGreaterThan(0);
    expect(
      report.newHoles.some(
        (h) => h.engine === "GT-003" && h.band === "5-6" && h.tag === "sort"
      )
    ).toBe(true);
  });

  it("Ca âm 5: tổng ô thủng vượt trần ratchet → report.passed = false", () => {
    const baseline = loadSeedMatrixBaseline();
    const lowerCeilingBaseline: SeedMatrixBaselineConfig = {
      ...baseline,
      max_deficits: 40, // Đặt trần 40 trong khi thực tế có 49
    };

    const report = evaluateEngineSeedMatrix(
      ALL_SEED_LEVELS,
      specsDir,
      lowerCeilingBaseline
    );
    expect(report.passed).toBe(false);
    expect(report.violations.some((v) => v.includes("vượt trần ratchet"))).toBe(
      true
    );
  });

  it("Ca âm 6: nguồn rỗng hoặc phiếu thiếu mục 13 → ném lỗi thích hợp", () => {
    expect(() => {
      evaluateEngineSeedMatrix([], specsDir);
    }).toThrow(ERR_EMPTY_SOURCE);

    const noSectionSpec = `
# GT-099 — Empty

## 12. Hợp đồng vẽ
Nội dung vẽ...
`;
    expect(() => {
      parseSeedMatrixFromSpec(noSectionSpec, "GT-099");
    }).toThrow(ERR_MISSING_SECTION_13);

    const noTableSpec = `
# GT-099 — No Table

## 13. Ma trận seed mục tiêu
Chưa có bảng nào ở đây.

## 14. Ca sai
`;
    expect(() => {
      parseSeedMatrixFromSpec(noTableSpec, "GT-099");
    }).toThrow(ERR_MISSING_TABLE);
  });
});
