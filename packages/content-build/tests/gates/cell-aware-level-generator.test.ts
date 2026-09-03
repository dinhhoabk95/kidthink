import { describe, expect, it } from "vitest";
import { validateCellSpec } from "#src/cli/cell-generator";
import { generateLevelsCore } from "#src/cli/gen-levels";
import { generateMatrixReport } from "../../scripts/check-matrix-budget.js";

describe("Cell-aware Level Generator (Task #161 / BR-LGK-12)", () => {
  it("Ca 1: --cell GT-026/4-5/C2 bị từ chối do bản đồ tương hợp cấm C2", () => {
    expect(() => validateCellSpec("GT-026/4-5/C2")).toThrow(
      "cấm phục vụ lĩnh vực 'C2'"
    );
  });

  it("Ca 2: --cell GT-002/3-4/C1 bị từ chối do GT-002 cấm band 3-4", () => {
    expect(() => validateCellSpec("GT-002/3-4/C1")).toThrow(
      "cấm age band '3-4'"
    );
  });

  it("Ca 3: --cell vào ô đã đạt K=3 bị từ chối", () => {
    // GT-001/3-4 đã đủ cả 6 competency
    expect(() => validateCellSpec("GT-001/3-4/C1")).toThrow(
      "đã đạt K=3, không thể sinh thêm qua --cell"
    );
  });

  it("Ca 4: --cell vào engine soạn tay GT-013/GT-015 bị từ chối", () => {
    expect(() => validateCellSpec("GT-013/3-4/C1")).toThrow("chỉ soạn tay");
    expect(() => validateCellSpec("GT-015/3-4/C1")).toThrow("chỉ soạn tay");
  });

  it("Ca 5: Cùng seed sinh ra cùng đầu ra tất định qua 100 lần chạy", () => {
    const opt = {
      engine: "GT-001",
      count: 1,
      seed: 999_888,
      theme: "farm",
      silent: true,
    };
    const first = JSON.stringify(generateLevelsCore(opt).items);

    for (let i = 0; i < 100; i++) {
      const run = JSON.stringify(generateLevelsCore(opt).items);
      expect(run).toBe(first);
    }
  });

  it("Ca 6: Khi sinh cho cell hợp lệ, 6 trường bắt buộc để trống", () => {
    // GT-020/5-6 là ô còn trống (< 3 comps: C2, C6), cho phép C1
    const res = generateLevelsCore({
      engine: "GT-020",
      cell: "GT-020/5-6/C1",
      count: 1,
      seed: 20_260_829,
      theme: "school",
      silent: true,
    });

    expect(res.writtenCount).toBe(1);
    const item = res.items[0] as {
      header: {
        title: string;
        instruction: string;
        skill_codes: string[];
        what_tags: string[];
        thinking_tags: string[];
        theme_tag: string;
      };
    };

    expect(item.header.title).toBe("");
    expect(item.header.instruction).toBe("");
    expect(item.header.skill_codes).toEqual([]);
    expect(item.header.what_tags).toEqual([]);
    expect(item.header.thinking_tags).toEqual([]);
    expect(item.header.theme_tag).toBe("");
  });

  it("Ca 7: Kiểm tra danh sách ô của generateMatrixReport khớp số lượng ô hợp lệ", () => {
    const report = generateMatrixReport();
    expect(report.totalCells).toBe(88);
    expect(report.reports.length).toBe(88);
  });
});
