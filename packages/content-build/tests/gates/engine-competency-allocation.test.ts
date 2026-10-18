import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ALL_SEED_LEVELS } from "#src/catalog";
import {
  CellExceptionSchema,
  type EngineAllocationConfig,
  EngineAllocationConfigSchema,
  evaluateEngineAllocationWithDebt,
  formatEngineAllocationReport,
  loadEngineAllocationDebt,
  runEngineAllocationGate,
} from "#src/gates/allocation";
import type { ContentSeed } from "#src/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Gate: Engine Competency Allocation (Task #158 & #309 S3 / BR-ECA-01..09)", () => {
  it("Corpus thật khớp chính xác với sổ nợ chỉ giảm (engine-allocation-debt.json) và không phát sinh vi phạm mới", () => {
    const result = runEngineAllocationGate();
    const debt = loadEngineAllocationDebt();
    const debtEval = evaluateEngineAllocationWithDebt(result, debt);

    expect(result.k).toBe(3);
    expect(result.totalCells).toBeGreaterThan(0);
    expect(result.deficitCells).toBe(debt.deficit_cells.length);
    expect(result.prohibitedViolations.length).toBe(
      debt.prohibited_levels.length
    );
    expect(result.violations.length).toBe(
      debt.deficit_cells.length + debt.prohibited_levels.length
    );
    expect(result.cellDeficits.map((d) => d.cell)).toEqual(debt.deficit_cells);
    expect(result.prohibitedViolations.map((p) => p.key).sort()).toEqual(
      [...debt.prohibited_levels].sort()
    );
    expect(debtEval.unexcusedViolations).toEqual([]);
    expect(debtEval.staleDebt).toEqual([]);
    expect(debtEval.passed).toBe(true);
  });

  it("BR-ECA-09: báo cáo in danh sách cụ thể ô nào thiếu lĩnh vực nào và cấm in tỷ lệ phần trăm chung (%)", () => {
    const result = runEngineAllocationGate();
    const formatted = formatEngineAllocationReport(result);

    expect(formatted).not.toContain("%");
    expect(formatted).toContain(
      "Danh sách ô thiếu lĩnh vực (BR-ECA-02 / BR-ECA-09):"
    );
    for (const d of result.cellDeficits) {
      expect(formatted).toContain(d.cell);
      for (const comp of d.missingCompetencies) {
        expect(formatted).toContain(comp);
      }
    }
  });

  it("BR-ECA-06: cổng luôn in mọi ngoại lệ ở mỗi lần chạy, kể cả khi kiểm tra đạt xanh", () => {
    const configWithException: EngineAllocationConfig = {
      date: "2026-10-18",
      version: "1.0",
      k: 1,
      exception_cap: 8,
      description: "Test in ngoại lệ khi xanh",
      engines: [
        {
          code: "GT-016",
          name: "Xoay kim đồng hồ",
          mechanic: "clock-hands",
          allowed_competencies: [
            { comp: "C4", reason: "Đo thời gian" },
            { comp: "C1", reason: "Số 1-12" },
            { comp: "C3", reason: "Quy luật" },
          ],
          prohibited_competencies: [],
        },
      ],
      exceptions: [
        {
          engine: "GT-016",
          band: "3-4",
          reason: "Trẻ 3-4 tuổi chưa học xem đồng hồ kim",
          decided_by: "pedagogy-lead",
          date: "2026-10-18",
        },
      ],
    };

    const result = runEngineAllocationGate(
      configWithException,
      ALL_SEED_LEVELS
    );
    const formatted = formatEngineAllocationReport(result);

    expect(formatted).toContain("Ngoại lệ đang bật (BR-ECA-06): 1/8");
    expect(formatted).toContain("GT-016::3-4");
    expect(formatted).toContain("Trẻ 3-4 tuổi chưa học xem đồng hồ kim");
    expect(formatted).toContain("pedagogy-lead");
  });

  it("Ca âm 1 (BR-ECA-05): ngoại lệ thiếu reason hoặc trường bắt buộc thì Zod ném lỗi", () => {
    const invalidException = {
      engine: "GT-016",
      band: "3-4",
      reason: "",
      decided_by: "pedagogy-lead",
      date: "2026-09-03",
    };

    expect(() => CellExceptionSchema.parse(invalidException)).toThrow(
      z.ZodError
    );
  });

  it("Ca âm 2 (BR-ECA-08): nguồn cấu hình không tồn tại hoặc corpus rỗng thì ném lỗi dừng tiến trình", () => {
    expect(() =>
      runEngineAllocationGate("/path/to/non-existent-config.json")
    ).toThrow("Không tìm thấy file cấu hình");

    expect(() => runEngineAllocationGate(undefined, [])).toThrow("BR-ECA-08");
  });

  it("Ca âm 3 (BR-ECA-07): số lượng ngoại lệ vượt quá trần cho phép (exception_cap) làm cổng đỏ", () => {
    const invalidConfig: EngineAllocationConfig = {
      date: "2026-09-03",
      version: "1.0",
      k: 3,
      exception_cap: 1,
      description: "Test cap",
      engines: [],
      exceptions: [
        {
          engine: "GT-001",
          band: "3-4",
          reason: "Lý do 1",
          decided_by: "lead",
          date: "2026-09-03",
        },
        {
          engine: "GT-002",
          band: "4-5",
          reason: "Lý do 2",
          decided_by: "lead",
          date: "2026-09-03",
        },
      ],
    };

    const parsed = EngineAllocationConfigSchema.parse(invalidConfig);
    expect(parsed.exceptions.length).toBeGreaterThan(parsed.exception_cap);

    const result = runEngineAllocationGate(invalidConfig, [
      VALID_GAME_LEVEL_SEED,
    ]);
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes("[BR-ECA-07]"))).toBe(true);
  });

  it("Ca âm 4 (BR-ECA-02): ô hợp lệ có số lĩnh vực < K mà không có ngoại lệ làm cổng đỏ", () => {
    const singleCompLevel: ContentSeed = {
      ...VALID_GAME_LEVEL_SEED,
      header: {
        ...VALID_GAME_LEVEL_SEED.header,
        code: "GL-C1-ONLY-0001",
        template_code: "GT-001",
        age_min: 3,
        age_max: 4,
        skill_codes: ["C1.CNT.01"],
      },
    };

    const result = runEngineAllocationGate(undefined, [singleCompLevel]);
    expect(result.valid).toBe(false);
    expect(result.deficitCells).toBeGreaterThan(0);

    const gt001Deficit = result.cellDeficits.find(
      (d) => d.cell === "GT-001::3-4"
    );
    expect(gt001Deficit).toBeDefined();
    expect(gt001Deficit?.actualCount).toBe(1);
    expect(gt001Deficit?.requiredCount).toBe(3);
    expect(gt001Deficit?.missingCompetencies).toContain("C2");
    expect(
      result.violations.some(
        (v) => v.includes("[BR-ECA-02]") && v.includes("GT-001::3-4")
      )
    ).toBe(true);
  });

  it("Ca âm 5 (BR-ECA-03): level gắn skill thuộc lĩnh vực bị cấm trong bản đồ của engine làm cổng đỏ", () => {
    const prohibitedLevel: ContentSeed = {
      ...VALID_GAME_LEVEL_SEED,
      header: {
        ...VALID_GAME_LEVEL_SEED.header,
        code: "GL-C2-GONOGO-PROHIBITED-0001",
        template_code: "GT-026",
        age_min: 4,
        age_max: 5,
        skill_codes: ["C2.GEO.01"],
      },
    };

    const result = runEngineAllocationGate(undefined, [
      ...ALL_SEED_LEVELS,
      prohibitedLevel,
    ]);
    expect(result.valid).toBe(false);
    expect(
      result.prohibitedViolations.some(
        (p) =>
          p.levelCode === "GL-C2-GONOGO-PROHIBITED-0001" &&
          p.engine === "GT-026" &&
          p.competency === "C2"
      )
    ).toBe(true);

    const debtEval = evaluateEngineAllocationWithDebt(result);
    expect(debtEval.passed).toBe(false);
    expect(
      debtEval.unexcusedViolations.some((v) =>
        v.includes("GL-C2-GONOGO-PROHIBITED-0001")
      )
    ).toBe(true);
  });
});
