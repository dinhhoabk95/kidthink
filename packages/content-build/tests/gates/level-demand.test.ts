import { describe, expect, it } from "vitest";
import { generateLevelsCore } from "#src/cli/gen-levels";
import type {
  ContentDemandLedger,
  DemandCell,
  DemandLevel,
} from "#src/gates/content-demand";
import {
  checkGenerationTarget,
  findDebtIncreases,
  findOrphanLevels,
  formatCoverage,
  summarizeCoverage,
} from "#src/gates/level-demand";

function cell(overrides: Partial<DemandCell> = {}): DemandCell {
  return {
    roadmap_code: "RM-A",
    band: "3-4",
    week_no: 1,
    session_no: 1,
    role: "practice",
    skill_code: "C1.CNT.01",
    topic_code: null,
    template_codes: ["GT-001", "GT-002"],
    level_quota: 3,
    filled_by: ["L1", "L2", "L3"],
    ...overrides,
  };
}

function ledger(cells: DemandCell[]): ContentDemandLedger {
  return { ledger_version: 1, summary: [], cells };
}

const NO_PRACTICE_CELL = /không có ô thực hành/;
const FILLED = cell();
const DEBT = cell({ week_no: 2, filled_by: ["L1"] });

describe("độ phủ theo ô (BR-LRM-09)", () => {
  it("đếm ô đã lấp trên tổng ô, không đếm hàng level", () => {
    const rows = summarizeCoverage(ledger([FILLED, DEBT]));
    expect(rows).toEqual([
      {
        roadmap_code: "RM-A",
        band: "3-4",
        cells: 2,
        filled_cells: 1,
        debt_cells: 1,
      },
    ]);
    expect(formatCoverage(rows)).toEqual([
      "RM-A (band 3-4): 1/2 ô đã lấp, nợ 1",
    ]);
  });

  it("ca âm: hạ một ô đã lấp thì nợ tăng và cổng báo rõ", () => {
    const before = ledger([FILLED, DEBT]);
    const demoted = ledger([{ ...FILLED, filled_by: ["L1", "L2"] }, DEBT]);
    expect(findDebtIncreases(before, demoted)).toEqual([
      { roadmap_code: "RM-A", before: 1, after: 2 },
    ]);
  });

  it("nợ giữ nguyên hoặc giảm thì không đỏ", () => {
    const before = ledger([FILLED, DEBT]);
    const improved = ledger([
      FILLED,
      { ...DEBT, filled_by: ["L1", "L2", "L3"] },
    ]);
    expect(findDebtIncreases(before, before)).toEqual([]);
    expect(findDebtIncreases(before, improved)).toEqual([]);
  });
});

describe("level mồ côi", () => {
  const levels: DemandLevel[] = [
    {
      code: "IN",
      skill_codes: ["C1.CNT.01"],
      age_min: 3,
      age_max: 4,
      difficulty: 1,
    },
    {
      code: "OUT",
      skill_codes: ["C9.XXX.99"],
      age_min: 3,
      age_max: 4,
      difficulty: 1,
    },
    { code: "NONE", skill_codes: [], age_min: 3, age_max: 4, difficulty: 1 },
  ];

  it("level không thuộc kỹ năng nào của sổ cầu là mồ côi", () => {
    expect(findOrphanLevels(ledger([FILLED]), levels)).toEqual(["NONE", "OUT"]);
  });
});

describe("cổng sinh level theo sổ cầu", () => {
  const source = ledger([FILLED, DEBT]);

  it("ca xanh: ô còn thiếu, khuôn hợp lệ", () => {
    const verdict = checkGenerationTarget(source, {
      skill_code: "C1.CNT.01",
      band: "3-4",
      engine: "GT-002",
    });
    expect(verdict.ok).toBe(true);
  });

  it("ca âm: kỹ năng không có ô thì đỏ", () => {
    const verdict = checkGenerationTarget(source, {
      skill_code: "C9.XXX.99",
      band: "3-4",
      engine: "GT-001",
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.ok === false && verdict.reason).toBe("no_cell");
  });

  it("ca âm: đúng kỹ năng nhưng sai band thì đỏ", () => {
    const verdict = checkGenerationTarget(source, {
      skill_code: "C1.CNT.01",
      band: "5-6",
      engine: "GT-001",
    });
    expect(verdict.ok === false && verdict.reason).toBe("no_cell");
  });

  it("ca âm: mọi ô đã lấp thì không sinh thêm", () => {
    const verdict = checkGenerationTarget(ledger([FILLED]), {
      skill_code: "C1.CNT.01",
      band: "3-4",
      engine: "GT-001",
    });
    expect(verdict.ok === false && verdict.reason).toBe("no_debt");
  });

  it("ca âm: khuôn ngoài ma trận tương hợp thì đỏ", () => {
    const verdict = checkGenerationTarget(source, {
      skill_code: "C1.CNT.01",
      band: "3-4",
      engine: "GT-099",
    });
    expect(verdict.ok === false && verdict.reason).toBe("engine_not_valid");
  });

  it("ô introduce không được tính là chỗ sinh level thực hành", () => {
    const introduceOnly = ledger([
      cell({ role: "introduce", level_quota: 1, filled_by: [] }),
    ]);
    const verdict = checkGenerationTarget(introduceOnly, {
      skill_code: "C1.CNT.01",
      band: "3-4",
      engine: "GT-001",
    });
    expect(verdict.ok === false && verdict.reason).toBe("no_cell");
  });
});

describe("gen-levels đọc sổ cầu thật", () => {
  it("ca âm: yêu cầu sinh level cho kỹ năng không có ô thì ném lỗi", () => {
    expect(() =>
      generateLevelsCore({
        engine: "GT-001",
        count: 1,
        seed: 1,
        theme: "school",
        silent: true,
        demand_skill: "C9.XXX.99",
      })
    ).toThrow(NO_PRACTICE_CELL);
  });

  it("không có --demand-skill thì level sinh ra không mang kỹ năng (mồ côi)", () => {
    const result = generateLevelsCore({
      engine: "GT-001",
      count: 1,
      seed: 1,
      theme: "school",
      silent: true,
    });
    const first = result.items[0];
    expect(first).toBeDefined();
    expect(JSON.stringify(first)).toContain('"skill_codes":[]');
  });
});
