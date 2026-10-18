import { describe, expect, it } from "vitest";
import {
  type LessonValidationInput,
  validateLessonModel,
} from "#src/lesson-model";

function validLesson(
  overrides: Partial<LessonValidationInput> = {}
): LessonValidationInput {
  return {
    code: "LES-0001",
    title: "Bài học đếm hạt đậu",
    guide: {
      outcome: "Bé đếm đúng từ 1 đến 5",
      preparation: ["5 hạt đậu", "1 chiếc cốc"],
      opening: "Hôm nay mẹ con mình cùng đếm hạt đậu nhé!",
      if_child_succeeds: "Thử đếm thêm đến 7 hạt đậu.",
      if_child_needs_help: "Mẹ cầm tay bé chỉ từng hạt và đếm chậm.",
    },
    estimated_minutes: 20,
    materials: "Hạt đậu, cốc nhựa",
    warm_up: "Vỗ tay 3 nhịp khởi động.",
    reflection: "Hỏi bé hôm nay đã đếm được mấy hạt đậu.",
    assessment: "Bé chỉ đúng từng hạt đậu và nói đúng tổng số trong 3 lần thử.",
    extension: "Đếm thêm muỗng trong bếp.",
    activity_kinds: ["manipulative", "digital_game"],
    skill_codes: ["C1.CNT.01"],
    ...overrides,
  };
}

describe("validateLessonModel (BR-LSM-01..09)", () => {
  it("BR-LSM-01: kiểm tra định dạng mã bài học và cung bậc khởi động → hoạt động chính → đúc kết", () => {
    const badCode = validateLessonModel(validLesson({ code: "BAD-CODE" }));
    expect(badCode.valid).toBe(false);
    expect(badCode.errors.some((e) => e.startsWith("BR-LSM-01:"))).toBe(true);

    const noActivities = validateLessonModel(
      validLesson({ activity_kinds: [], activities: [] })
    );
    expect(noActivities.valid).toBe(false);
    expect(noActivities.errors.some((e) => e.startsWith("BR-LSM-01:"))).toBe(
      true
    );

    const missingArc = validateLessonModel(
      validLesson({ warm_up: "", reflection: "" })
    );
    expect(
      missingArc.warnings.filter((w) => w.startsWith("BR-LSM-01:")).length
    ).toBe(2);
  });

  it("BR-LSM-02: bắt buộc có ít nhất 1 hoạt động ngoài màn hình", () => {
    const digitalOnly = validateLessonModel(
      validLesson({ activity_kinds: ["digital_game"] })
    );
    expect(digitalOnly.valid).toBe(false);
    expect(digitalOnly.errors.some((e) => e.startsWith("BR-LSM-02:"))).toBe(
      true
    );
  });

  it("BR-LSM-03: guide phải trả lời đủ 5 câu hỏi cho người lớn", () => {
    const incompleteGuide = validateLessonModel(
      validLesson({
        guide: {
          outcome: "Bé đếm đúng",
          preparation: [],
          opening: "",
          if_child_succeeds: "Khen",
          if_child_needs_help: "Giúp",
        },
      })
    );
    expect(incompleteGuide.valid).toBe(false);
    expect(incompleteGuide.errors.some((e) => e.startsWith("BR-LSM-03:"))).toBe(
      true
    );
  });

  it("BR-LSM-04: vật liệu phải là đồ có sẵn trong nhà, cấm đồ chuyên dụng", () => {
    const expensive = validateLessonModel(
      validLesson({ materials: "Bộ giáo cụ chuyên dụng đắt tiền" })
    );
    expect(expensive.valid).toBe(false);
    expect(expensive.errors.some((e) => e.startsWith("BR-LSM-04:"))).toBe(true);
  });

  it("BR-LSM-05: tổng thời lượng mục tiêu 15–30 phút, trần cứng 45 phút", () => {
    const overCeiling = validateLessonModel(
      validLesson({ estimated_minutes: 50 })
    );
    expect(overCeiling.valid).toBe(false);
    expect(overCeiling.errors.some((e) => e.startsWith("BR-LSM-05:"))).toBe(
      true
    );

    const outsideIdeal = validateLessonModel(
      validLesson({ estimated_minutes: 10 })
    );
    expect(outsideIdeal.valid).toBe(true);
    expect(outsideIdeal.warnings.some((w) => w.startsWith("BR-LSM-05:"))).toBe(
      true
    );
  });

  it("BR-LSM-06: đánh giá mô tả hành vi quan sát được, cấm từ trừu tượng", () => {
    const abstractAssessment = validateLessonModel(
      validLesson({ assessment: "Bé hiểu khái niệm số lượng" })
    );
    expect(abstractAssessment.valid).toBe(false);
    expect(
      abstractAssessment.errors.some((e) => e.startsWith("BR-LSM-06:"))
    ).toBe(true);
  });

  it("BR-LSM-07: cấm giả định trẻ biết đọc chữ", () => {
    const assumesReading = validateLessonModel(
      validLesson({ title: "Bé tự đọc chữ trên thẻ" })
    );
    expect(assumesReading.valid).toBe(false);
    expect(assumesReading.errors.some((e) => e.startsWith("BR-LSM-07:"))).toBe(
      true
    );
  });

  it("BR-LSM-08: bài học phục vụ cụm mục tiêu tập trung (tối đa 3 skill)", () => {
    const tooManySkills = validateLessonModel(
      validLesson({
        skill_codes: ["C1.CNT.01", "C1.CNT.02", "C1.CNT.03", "C1.CNT.04"],
      })
    );
    expect(tooManySkills.valid).toBe(false);
    expect(tooManySkills.errors.some((e) => e.startsWith("BR-LSM-08:"))).toBe(
      true
    );
  });

  it("BR-LSM-09: phần mở rộng (extension) là tuỳ chọn, không bắt buộc", () => {
    const withoutExtension = validateLessonModel(
      validLesson({ extension: null })
    );
    expect(withoutExtension.valid).toBe(true);
    expect(withoutExtension.errors).toEqual([]);
  });
});
