import { describe, expect, it } from "vitest";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures";
import {
  GT009ContentSchema,
  GT009DifficultySchema,
} from "#src/templates/GT-009/template";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures";
import {
  GT035_MAX_GRID_ROWS,
  GT035ContentSchema,
} from "#src/templates/GT-035/template";

/**
 * Phase 25 (`BR-LAY-12`): contract chặn level vượt sức chứa khung nhỏ nhất
 * 360x640 ở sàn chạm — `BR-E009-09` (ứng viên GT-009) và `BR-E035-17` (hàng
 * lưới GT-035). Bậc thang đo thật nằm ở `action-clear.test.ts`.
 */
describe("contract giữ level vừa khung 360x640 (BR-LAY-12)", () => {
  it("GT-009 từ chối 7 ứng viên, nhận 6 (BR-E009-09)", () => {
    const base = GT009_FIXTURES.find((f) => f.content.candidates.length === 6);
    if (!base) {
      throw new Error("Thiếu fixture GT-009 sáu ứng viên");
    }
    expect(GT009ContentSchema.safeParse(base.content).success).toBe(true);
    const extra = {
      candidate_id: "c7",
      value: 7,
    };
    const seven = {
      ...base.content,
      candidates: [...base.content.candidates, extra],
    };
    expect(GT009ContentSchema.safeParse(seven).success).toBe(false);
    expect(
      GT009DifficultySchema.safeParse({ ...base.difficulty, item_count: 7 })
        .success
    ).toBe(false);
  });

  it("GT-035 từ chối lưới 4 hàng, nhận 3 hàng (BR-E035-17)", () => {
    const base = GT035_FIXTURES[0];
    if (!base) {
      throw new Error("Thiếu fixture GT-035");
    }
    expect(GT035ContentSchema.safeParse(base.content).success).toBe(true);
    const tall = {
      ...base.content,
      grid: { rows: GT035_MAX_GRID_ROWS + 1, cols: base.content.grid.cols },
    };
    expect(GT035ContentSchema.safeParse(tall).success).toBe(false);
  });

  it("mọi fixture GT-035 có tối đa 3 hàng", () => {
    for (const f of GT035_FIXTURES) {
      expect(f.content.grid.rows, f.id).toBeLessThanOrEqual(
        GT035_MAX_GRID_ROWS
      );
    }
  });
});
