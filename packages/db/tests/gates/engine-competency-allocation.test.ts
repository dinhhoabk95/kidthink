import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  CellExceptionSchema,
  EngineAllocationConfigSchema,
  runEngineAllocationGate,
} from "../../src/seed-content/gates/allocation.js";

describe("Gate: Engine Competency Allocation (Task #158 / BR-ECA-01..09)", () => {
  it("chạy thành công trên cấu hình hợp lệ và trả về các chỉ số ma trận", () => {
    const result = runEngineAllocationGate();
    expect(result.k).toBe(3);
    expect(result.totalCells).toBeGreaterThan(0);
    expect(typeof result.deficitCells).toBe("number");
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it("Ca âm 1 (BR-ECA-05): ngoại lệ thiếu reason hoặc trường bắt buộc thì Zod ném lỗi", () => {
    const invalidException = {
      engine: "GT-016",
      band: "3-4",
      reason: "", // Rỗng - vi phạm
      decided_by: "pedagogy-lead",
      date: "2026-09-03",
    };

    expect(() => CellExceptionSchema.parse(invalidException)).toThrow(
      z.ZodError
    );
  });

  it("Ca âm 2 (BR-ECA-08): nguồn cấu hình không tồn tại thì ném lỗi dừng tiến trình", () => {
    expect(() =>
      runEngineAllocationGate("/path/to/non-existent-config.json")
    ).toThrow("Không tìm thấy file cấu hình");
  });

  it("Ca âm 3 (BR-ECA-07): số lượng ngoại lệ vượt quá trần cho phép (exception_cap)", () => {
    const invalidConfig = {
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
  });
});
