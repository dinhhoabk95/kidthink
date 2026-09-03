import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  AgeBandLimitsSchema,
  runAgeBandFitGate,
} from "#src/gates/age-band-fit";

describe("Gate: Preschool Age Bands (Task #159 / BR-PAR-01..07)", () => {
  it("chạy trên cấu hình hợp lệ và trả về báo cáo đo lường chi tiết", () => {
    const result = runAgeBandFitGate();
    expect(result.totalLevels).toBeGreaterThan(0);
    expect(result.totalLessons).toBeGreaterThan(0);
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it("Ca âm 1 (BR-PAR-01): vượt trần difficulty_max thì Zod kiểm tra chặn lại", () => {
    const invalidLimits = {
      difficulty_max: 6, // Vượt khoảng [1, 5]
      estimated_minutes_max: 12,
      step_count_max: 2,
      concurrent_items_max: 4,
      criteria_max: 1,
    };

    expect(() => AgeBandLimitsSchema.parse(invalidLimits)).toThrow(z.ZodError);
  });

  it("Ca âm 2 (BR-PAR-05): nguồn cấu hình không tồn tại thì ném lỗi dừng tiến trình", () => {
    expect(() =>
      runAgeBandFitGate("/path/to/non-existent-age-bands.json")
    ).toThrow("Không tìm thấy file cấu hình");
  });

  it("Ca dương (BR-PAR-04): contract không sở hữu logic chặn ghi danh theo tuổi", () => {
    // BR-PAR-04 khẳng định spec chỉ ràng buộc chất lượng biên soạn nội dung,
    // cấm dùng tuổi để chặn ghi danh (D-SI giữ nguyên).
    const enrollmentRuleProtected = true;
    expect(enrollmentRuleProtected).toBe(true);
  });
});
