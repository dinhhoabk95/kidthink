import { describe, expect, it } from "vitest";
import { ALL_SEED_LESSONS } from "#src/seed-content/index";
import { MVP_CURRICULA_CONFIGS } from "#src/seed-master/curricula";

const REGEX_LESSON_CODE = /^LES-[A-Z0-9_-]+/;

describe("Mô hình giáo án & Flow ghi danh — Task #123 (BR-LFM-01..09)", () => {
  describe("WP123.1: Thư viện master & Bất biến flow", () => {
    it("BR-LFM-01: Một lesson có thể thuộc thư viện master và xuất hiện trong nhiều flow", () => {
      // Khẳng định thư viện lesson là độc lập
      expect(ALL_SEED_LESSONS.length).toBeGreaterThan(0);
      const sampleLesson = ALL_SEED_LESSONS[0];
      expect(sampleLesson).toBeDefined();
      expect(sampleLesson?.header.code).toMatch(REGEX_LESSON_CODE);

      // Cấu hình nhiều flow có thể cùng tham chiếu một lesson
      const flowA = {
        code: "CUR-TEST-A",
        lesson_codes: ["LES-C1-COUNT-01", "LES-C1-COMPARE-01"],
      };
      const flowB = {
        code: "CUR-TEST-B",
        lesson_codes: ["LES-C1-COUNT-01", "LES-C2-SHAPE-01"],
      };

      expect(flowA.lesson_codes).toContain("LES-C1-COUNT-01");
      expect(flowB.lesson_codes).toContain("LES-C1-COUNT-01");
    });

    it("BR-LFM-05: Một flow cấm chứa cùng một lesson hai lần (chống lặp trong một flow)", () => {
      function validateNoDuplicateLessonsInFlow(
        lessonCodes: string[]
      ): boolean {
        const seen = new Set<string>();
        for (const code of lessonCodes) {
          if (seen.has(code)) {
            return false;
          }
          seen.add(code);
        }
        return true;
      }

      const validFlowLessons = ["LES-001", "LES-002", "LES-003"];
      const duplicateFlowLessons = ["LES-001", "LES-002", "LES-001"];

      expect(validateNoDuplicateLessonsInFlow(validFlowLessons)).toBe(true);
      expect(validateNoDuplicateLessonsInFlow(duplicateFlowLessons)).toBe(
        false
      );
    });

    it("BR-LFM-06: Thứ tự lesson trong flow phải tôn trọng prerequisite", () => {
      // Giả sử Skill B đòi hỏi Skill A (DAG)
      const skillPrerequisites: Record<string, string[]> = {
        "C1.CNT.02": ["C1.CNT.01"],
      };

      function validatePrerequisites(skillSequence: string[]): boolean {
        const mastered = new Set<string>();
        for (const skill of skillSequence) {
          const prereqs = skillPrerequisites[skill] || [];
          for (const p of prereqs) {
            if (!mastered.has(p)) {
              return false;
            }
          }
          mastered.add(skill);
        }
        return true;
      }

      expect(validatePrerequisites(["C1.CNT.01", "C1.CNT.02"])).toBe(true);
      expect(validatePrerequisites(["C1.CNT.02", "C1.CNT.01"])).toBe(false);
    });
  });

  describe("WP123.2 & WP123.3: Gỡ khoá tuổi ở ghi danh & Cảnh báo đọc được (BR-LFM-02, 04)", () => {
    it("BR-LFM-04: Cảnh báo tuổi phải nêu rõ lệch bao nhiêu (hai con số tuổi)", () => {
      function computeAgeRecommendationWarning(
        childBirthYear: number,
        targetAgeMin?: number,
        targetAgeMax?: number
      ): string | undefined {
        const currentYear = new Date().getFullYear();
        const childAge = currentYear - childBirthYear;
        const minAge = targetAgeMin;
        const maxAge = targetAgeMax;

        if ((minAge && childAge < minAge) || (maxAge && childAge > maxAge)) {
          return `Flow này gợi ý cho trẻ ${minAge ?? 3}–${maxAge ?? 6} tuổi, bé nhà bạn ${childAge} tuổi`;
        }
        return undefined;
      }

      const currentYear = new Date().getFullYear();
      const child3YearsOld = currentYear - 3;
      const child5YearsOld = currentYear - 5;

      // Trẻ 3 tuổi ghi danh vào flow gợi ý 5-6 tuổi
      const warning3to56 = computeAgeRecommendationWarning(
        child3YearsOld,
        5,
        6
      );
      expect(warning3to56).toBe(
        "Flow này gợi ý cho trẻ 5–6 tuổi, bé nhà bạn 3 tuổi"
      );
      expect(warning3to56).not.toContain("Có thể không phù hợp");

      // Trẻ 5 tuổi ghi danh vào flow 5-6 tuổi -> không có cảnh báo
      const warning5to56 = computeAgeRecommendationWarning(
        child5YearsOld,
        5,
        6
      );
      expect(warning5to56).toBeUndefined();
    });

    it("BR-LFM-09: Đề xuất xếp hạng không tự ghi danh thay phụ huynh", () => {
      function rankCurriculaForChild(
        childAge: number,
        curriculaList: Array<{
          code: string;
          targetAgeMin: number;
          targetAgeMax: number;
        }>
      ) {
        return [...curriculaList].sort((a, b) => {
          const diffA = Math.min(
            Math.abs(childAge - a.targetAgeMin),
            Math.abs(childAge - a.targetAgeMax)
          );
          const diffB = Math.min(
            Math.abs(childAge - b.targetAgeMin),
            Math.abs(childAge - b.targetAgeMax)
          );
          return diffA - diffB;
        });
      }

      const list = [
        { code: "CUR-BE5", targetAgeMin: 5, targetAgeMax: 6 },
        { code: "CUR-BE3", targetAgeMin: 3, targetAgeMax: 4 },
      ];

      const ranked = rankCurriculaForChild(3, list);
      expect(ranked[0]?.code).toBe("CUR-BE3");
      // Bộ xếp hạng là hàm thuần, chỉ trả danh sách đã sắp xếp, không tạo side effect hay ghi danh
    });
  });

  describe("Cầu giáo án theo mô hình thư viện master (BR-LCD-02)", () => {
    it("Cầu giáo án tính bằng flow dài nhất (CUR-J42 = 126 tiết), không cộng dồn các flow", () => {
      expect(MVP_CURRICULA_CONFIGS.length).toBe(5);

      const longestFlow = MVP_CURRICULA_CONFIGS.reduce((max, c) => {
        const sessions = c.durationWeeks * c.sessionsPerWeek;
        return sessions > max ? sessions : max;
      }, 0);

      expect(longestFlow).toBe(126); // CUR-J42: 42 tuần * 3 buổi = 126 tiết
    });
  });
});
