import {
  buildAgeRecommendationWarning,
  findDuplicateLessonsInFlow,
  findPrerequisiteViolation,
} from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import { ALL_SEED_LESSONS } from "#src/index";
import { MVP_CURRICULA_CONFIGS } from "#src/seed-master/curricula";

/**
 * Bản trước của file này khai `validateNoDuplicateLessonsInFlow` và
 * `validatePrerequisites` NGAY TRONG thân test rồi kiểm chính chúng, và chép
 * nguyên văn chuỗi cảnh báo tuổi từ route. Cả ba luật vì thế Cấm — NEVER có
 * cài đặt production nào, mà `lesson-flow-model.md` vẫn được lật sang
 * `implemented`. Xoá route đi thì bộ test cũ vẫn xanh.
 *
 * Giờ mọi hàm đều import từ `@mindkid/shared`.
 */
const REGEX_LESSON_CODE = /^LES-[A-Z0-9_-]+/;

describe("BR-LFM-01: thư viện lesson master độc lập với flow", () => {
  it("corpus lesson thật không rỗng và mã đúng khuôn", () => {
    expect(ALL_SEED_LESSONS.length).toBeGreaterThan(0);
    for (const lesson of ALL_SEED_LESSONS) {
      expect(lesson.header.code).toMatch(REGEX_LESSON_CODE);
    }
  });

  it("mã lesson là duy nhất trên toàn thư viện", () => {
    const codes = ALL_SEED_LESSONS.map((l) => l.header.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("BR-LFM-05: một flow cấm chứa cùng một lesson hai lần", () => {
  it("flow hợp lệ không có trùng", () => {
    expect(findDuplicateLessonsInFlow(["LES-001", "LES-002"])).toEqual([]);
  });

  it("ca âm: lesson lặp bị nêu tên", () => {
    expect(
      findDuplicateLessonsInFlow(["LES-001", "LES-002", "LES-001"])
    ).toEqual(["LES-001"]);
  });

  it("mọi flow trong MVP_CURRICULA_CONFIGS đều sạch", () => {
    for (const flow of MVP_CURRICULA_CONFIGS) {
      const codes = (flow as { lesson_codes?: string[] }).lesson_codes ?? [];
      expect(findDuplicateLessonsInFlow(codes), flow.code).toEqual([]);
    }
  });
});

describe("BR-LFM-06: thứ tự lesson tôn trọng prerequisite", () => {
  const prereq = { "C1.CNT.02": ["C1.CNT.01"] } as const;

  it("thứ tự đúng thì không có vi phạm", () => {
    expect(
      findPrerequisiteViolation(["C1.CNT.01", "C1.CNT.02"], prereq)
    ).toBeUndefined();
  });

  it("ca âm: đảo thứ tự thì nêu đúng kỹ năng và điều kiện còn thiếu", () => {
    expect(
      findPrerequisiteViolation(["C1.CNT.02", "C1.CNT.01"], prereq)
    ).toEqual({ skill: "C1.CNT.02", missing: "C1.CNT.01" });
  });
});

describe("BR-LFM-04: cảnh báo tuổi nêu rõ số tuổi lệch", () => {
  it("trong khoảng thì không cảnh báo", () => {
    expect(
      buildAgeRecommendationWarning({
        childAge: 5,
        targetAgeMin: 4,
        targetAgeMax: 6,
      })
    ).toBeUndefined();
  });

  it("ca âm: trẻ lớn hơn nhãn thì cảnh báo kèm cả hai con số", () => {
    const warning = buildAgeRecommendationWarning({
      childAge: 8,
      targetAgeMin: 4,
      targetAgeMax: 6,
    });
    expect(warning).toContain("4–6");
    expect(warning).toContain("bé nhà bạn 8 tuổi");
  });

  it("ca âm: trẻ nhỏ hơn nhãn cũng cảnh báo", () => {
    expect(
      buildAgeRecommendationWarning({
        childAge: 3,
        targetAgeMin: 5,
        targetAgeMax: 6,
      })
    ).toContain("bé nhà bạn 3 tuổi");
  });

  it("targetAgeMin = 0 là mốc CÓ THẬT, không phải 'chưa khai'", () => {
    // `(minAge && childAge < minAge)` của bản cũ coi 0 là chưa khai.
    expect(
      buildAgeRecommendationWarning({
        childAge: 1,
        targetAgeMin: 0,
        targetAgeMax: 6,
      })
    ).toBeUndefined();
  });
});
