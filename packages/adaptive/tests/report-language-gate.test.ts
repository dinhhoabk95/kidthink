import { describe, expect, it } from "vitest";
import {
  determineTrendDirection,
  FORBIDDEN_DIAGNOSTIC_WORDS,
  FORBIDDEN_NORMATIVE_WORDS,
  FORBIDDEN_PREDICTIVE_WORDS,
  trendDirectionDescription,
  validateReportLanguage,
} from "../src/index.js";

describe("P3.7 Report Language Gate & Trend Helpers (BR-ARP-01, BR-ARP-04, BR-ARP-05, BR-ARP-07)", () => {
  describe("Language Gate Negative Fixtures (BR-ARP-01, BR-ARP-05, BR-ARP-07)", () => {
    it("Scenario: BR-ARP-01 — fixture containing diagnostic words triggers violation", () => {
      for (const word of FORBIDDEN_DIAGNOSTIC_WORDS) {
        const text = `Bé học còn ${word} trong bài toán này.`;
        const result = validateReportLanguage(text);
        expect(result.valid).toBe(false);
        expect(result.violations).toContain(word);
      }
    });

    it("Scenario: BR-ARP-05 — fixture containing future predictions triggers violation", () => {
      for (const word of FORBIDDEN_PREDICTIVE_WORDS) {
        const text = `Bé ${word} mức thành thạo trong tuần tới.`;
        const result = validateReportLanguage(text);
        expect(result.valid).toBe(false);
        expect(result.violations).toContain(word);
      }
    });

    it("Scenario: BR-ARP-07 — fixture containing external normative comparisons triggers violation", () => {
      for (const word of FORBIDDEN_NORMATIVE_WORDS) {
        const text = `Khả năng của bé vượt trội ${word}.`;
        const result = validateReportLanguage(text);
        expect(result.valid).toBe(false);
        expect(result.violations).toContain(word);
      }
    });

    it("accepts clean, pedagogical and positive action guidance", () => {
      const cleanTexts = [
        "Bé đã làm quen với việc đếm các đồ vật xung quanh.",
        "Cùng bé đếm 5 chiếc thìa khi chuẩn bị bữa tối gia đình.",
        "Trò chơi phân loại hình tròn và hình vuông mức độ cơ bản.",
        "Nhịp tham gia và hoạt động của bé duy trì ổn định qua các tuần.",
        "Mức độ hoàn thành và nhịp hoạt động của bé đang tăng trưởng tích cực.",
      ];

      for (const text of cleanTexts) {
        const result = validateReportLanguage(text);
        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
      }
    });
  });

  describe("Trend Direction Discreteness (BR-ARP-04)", () => {
    it("Scenario: BR-ARP-04 — classifies trend delta into exactly 3 discrete states without raw slope", () => {
      expect(determineTrendDirection(0.12)).toBe("improving");
      expect(determineTrendDirection(0.01)).toBe("steady");
      expect(determineTrendDirection(-0.02)).toBe("steady");
      expect(determineTrendDirection(-0.15)).toBe("needs_attention");
    });

    it("Scenario: BR-ARP-04 — provides standardized Vietnamese description for each trend state", () => {
      const improvingDesc = trendDirectionDescription("improving");
      const steadyDesc = trendDirectionDescription("steady");
      const needsAttentionDesc = trendDirectionDescription("needs_attention");

      expect(improvingDesc).toContain("tăng trưởng tích cực");
      expect(steadyDesc).toContain("duy trì ổn định");
      expect(needsAttentionDesc).toContain("cần người lớn đồng hành củng cố");

      // Verify no forbidden words in generated descriptions
      expect(validateReportLanguage(improvingDesc).valid).toBe(true);
      expect(validateReportLanguage(steadyDesc).valid).toBe(true);
      expect(validateReportLanguage(needsAttentionDesc).valid).toBe(true);
    });
  });
});
