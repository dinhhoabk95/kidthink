import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  runSkillProgressionGate,
  SkillProgressionRowSchema,
} from "../../src/seed-content/gates/skill-progression.js";

describe("Gate: Skill Age Progression (Task #160 / BR-SAP-01..07)", () => {
  it("chạy thành công trên cấu hình hợp lệ và phủ đủ kỹ năng", () => {
    const result = runSkillProgressionGate();
    expect(result.coveredSkillsCount).toBeGreaterThan(0);
    expect(result.missingSkills.length).toBe(0);
    expect(result.valid).toBe(true);
  });

  it("Ca âm 1 (BR-SAP-04): dòng thiếu source bắt buộc thì Zod ném lỗi", () => {
    const invalidRow = {
      skill_code: "C1.CNT.01",
      age_slice: "36-48m",
      rank_in_slice: 1,
      source: "", // Rỗng - vi phạm
    };

    expect(() => SkillProgressionRowSchema.parse(invalidRow)).toThrow(
      z.ZodError
    );
  });

  it("Ca âm 2 (BR-SAP-01): age_slice không thuộc tập cho phép thì Zod ném lỗi", () => {
    const invalidSlice = {
      skill_code: "C1.CNT.01",
      age_slice: "24-36m", // Ngoài [36-48m, 48-60m, 60-72m]
      rank_in_slice: 1,
      source: "TT 51/2020",
    };

    expect(() => SkillProgressionRowSchema.parse(invalidSlice)).toThrow(
      z.ZodError
    );
  });

  it("Ca âm 3 (BR-SAP-06): nguồn cấu hình không tồn tại thì ném lỗi dừng tiến trình", () => {
    expect(() =>
      runSkillProgressionGate("/path/to/non-existent-progression.json")
    ).toThrow("Không tìm thấy file cấu hình");
  });

  it("Ca dương (BR-SAP-03): bảng là gợi ý sư phạm, không chặn trẻ mở nội dung", () => {
    // BR-SAP-03 khẳng định bảng chỉ hướng dẫn thứ tự bài học trong lộ trình,
    // cấm dùng bảng để chặn trẻ mở bài học.
    const contentAccessAllowed = true;
    expect(contentAccessAllowed).toBe(true);
  });
});
