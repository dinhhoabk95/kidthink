import { describe, expect, it } from "vitest";
import {
  type ActivityValidationInput,
  calculateActivityAgeBand,
  validateActivityModel,
} from "#src/activity-model";

function createValidInput(
  overrides: Partial<ActivityValidationInput> = {}
): ActivityValidationInput {
  return {
    code: "ACT-0001",
    activity_kind: "manipulative",
    title: "Đếm hạt đậu",
    instruction: {
      preparation: "Chuẩn bị cốc nhựa và hạt đậu lớn",
      steps: [
        { instruction: "Đặt cốc lên bàn", say_to_child: '"Con hãy đếm"' },
      ],
      easier: "Giảm xuống 3 hạt",
      harder: "Tăng lên 10 hạt",
    },
    materials: "Cốc nhựa, hạt đậu lớn",
    estimated_minutes: 10,
    skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
    ...overrides,
  };
}

describe("Activity Model Validation (BR-ACM-01..08, BR-ID-05, D-LB..D-LE)", () => {
  it("BR-ID-05: rejects invalid activity code pattern", () => {
    const res = validateActivityModel(createValidInput({ code: "INVALID-01" }));
    expect(res.valid).toBe(false);
    expect(res.errors).toContain(
      "BR-ID-05: Mã activity phải có định dạng ACT-xxxx (4 chữ số)."
    );
  });

  it("D-LB: rejects unapproved activity kind outside 10 allowed kinds", () => {
    const res = validateActivityModel(
      createValidInput({ activity_kind: "unapproved_kind" })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith("D-LB:"))).toBe(true);
  });

  it("D-LC: requires ref_type and ref_id/ref_code for digital_game and worksheet", () => {
    const missingGameRef = validateActivityModel(
      createValidInput({
        activity_kind: "digital_game",
        ref_type: null,
        ref_id: null,
      })
    );
    expect(missingGameRef.valid).toBe(false);
    expect(missingGameRef.errors.some((e) => e.startsWith("D-LC:"))).toBe(true);

    const missingWorksheetRef = validateActivityModel(
      createValidInput({
        activity_kind: "worksheet",
        ref_type: null,
      })
    );
    expect(missingWorksheetRef.valid).toBe(false);
    expect(missingWorksheetRef.errors.some((e) => e.startsWith("D-LC:"))).toBe(
      true
    );
  });

  it("BR-ACM-01: forbids referencing previous lessons or specific lesson context", () => {
    const res = validateActivityModel(
      createValidInput({
        title: "Ôn lại bài cũ và tiếp tục từ bài trước",
      })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith("BR-ACM-01:"))).toBe(true);
  });

  it("BR-ACM-02: enforces estimated_minutes in [2, 20]", () => {
    const tooShort = validateActivityModel(
      createValidInput({ estimated_minutes: 1 })
    );
    expect(tooShort.valid).toBe(false);
    expect(tooShort.errors).toContain(
      "BR-ACM-02: Thời lượng hoạt động phải nằm trong khoảng từ 2 đến 20 phút."
    );

    const tooLong = validateActivityModel(
      createValidInput({ estimated_minutes: 25 })
    );
    expect(tooLong.valid).toBe(false);
    expect(tooLong.errors).toContain(
      "BR-ACM-02: Thời lượng hoạt động phải nằm trong khoảng từ 2 đến 20 phút."
    );
  });

  it("BR-ACM-03: requires 4-part instruction and direct spoken quote to child", () => {
    const res = validateActivityModel(
      createValidInput({
        instruction: {
          preparation: "",
          steps: [{ instruction: "Làm không nói gì", say_to_child: "" }],
          easier: "",
          harder: "",
        },
      })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith("BR-ACM-03:"))).toBe(true);
  });

  it("BR-ACM-04: forbids specialized or expensive store-bought materials", () => {
    const res = validateActivityModel(
      createValidInput({
        materials: "Bộ giáo cụ chuyên dụng đắt tiền mua ngoài tiệm chuyên",
      })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith("BR-ACM-04:"))).toBe(true);
  });

  it("BR-ACM-05: forbids printing requirements unless activity kind is worksheet", () => {
    const res = validateActivityModel(
      createValidInput({
        activity_kind: "manipulative",
        materials: "Cần máy in và bản in màu phiếu in",
      })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith("BR-ACM-05:"))).toBe(true);
  });

  it("BR-ACM-06: requires both easier (scaffold) and harder (challenge) variants", () => {
    const res = validateActivityModel(
      createValidInput({
        instruction: 'Nói với bé: "Con đếm nhé" Dễ hơn: đếm 3 hạt',
      })
    );
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.startsWith("BR-ACM-06:"))).toBe(true);
  });

  it("BR-ACM-07: forbids sharp objects and choking hazards (< 3cm) for age 3-4", () => {
    const sharpRes = validateActivityModel(
      createValidInput({
        materials: "Dao nhọn và kéo sắc",
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      })
    );
    expect(sharpRes.valid).toBe(false);
    expect(sharpRes.errors.some((e) => e.startsWith("BR-ACM-07:"))).toBe(true);

    const chokeRes = validateActivityModel(
      createValidInput({
        materials: "Hạt cườm nhỏ < 3cm",
        skills: [{ code: "C1.CNT.01", age_min: 3, age_max: 4 }],
      })
    );
    expect(chokeRes.valid).toBe(false);
    expect(chokeRes.errors.some((e) => e.startsWith("BR-ACM-07:"))).toBe(true);
  });

  it("BR-ACM-08: requires 1 or 2 skills per activity (rejects 0 or >= 3)", () => {
    const zeroSkills = validateActivityModel(createValidInput({ skills: [] }));
    expect(zeroSkills.valid).toBe(false);
    expect(zeroSkills.errors.some((e) => e.startsWith("BR-ACM-08:"))).toBe(
      true
    );

    const threeSkills = validateActivityModel(
      createValidInput({
        skills: [
          { code: "C1.CNT.01", age_min: 3, age_max: 5 },
          { code: "C1.CNT.02", age_min: 3, age_max: 5 },
          { code: "C1.CNT.03", age_min: 3, age_max: 5 },
        ],
      })
    );
    expect(threeSkills.valid).toBe(false);
    expect(threeSkills.errors.some((e) => e.startsWith("BR-ACM-08:"))).toBe(
      true
    );
  });

  it("D-LD & D-LE: emits D-LD warnings (no phantom BR-ACM-07.2) and validates skill age intersection", () => {
    const discussionRes = validateActivityModel(
      createValidInput({
        activity_kind: "discussion",
        instruction: {
          preparation: "Ngồi vòng tròn",
          steps: [{ instruction: "Hỏi trẻ", say_to_child: '"Con thấy sao"' }],
          easier: "Gợi ý",
          harder: "Mở rộng",
        },
      })
    );
    expect(discussionRes.warnings.some((w) => w.startsWith("D-LD:"))).toBe(
      true
    );
    expect(discussionRes.warnings.some((w) => w.includes("BR-ACM-07.2"))).toBe(
      false
    );

    const disjointAge = calculateActivityAgeBand([
      { age_min: 3, age_max: 4 },
      { age_min: 5, age_max: 6 },
    ]);
    expect(disjointAge.valid).toBe(false);

    const disjointActivity = validateActivityModel(
      createValidInput({
        skills: [
          { code: "C1.CNT.01", age_min: 3, age_max: 4 },
          { code: "C1.CNT.09", age_min: 5, age_max: 6 },
        ],
      })
    );
    expect(disjointActivity.valid).toBe(false);
    expect(disjointActivity.errors.some((e) => e.startsWith("D-LE:"))).toBe(
      true
    );
  });
});
