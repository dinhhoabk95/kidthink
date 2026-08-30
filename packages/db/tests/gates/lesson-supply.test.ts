import { describe, expect, it } from "vitest";
import {
  evaluateLessonSupply,
  formatLessonSupplyReport,
} from "#src/seed-content/gates/lesson-supply";
import type { ContentSeed, LessonSeed } from "#src/seed-content/types";
import type { MvpCurriculumConfig } from "#src/seed-master/curricula";

const REGEX_PERCENT = /\b\d+%/;

describe("Cổng Cung Cầu Giáo Án — Task #124 (BR-LCD-01..11)", () => {
  const mockCurricula: MvpCurriculumConfig[] = [
    {
      code: "CUR-BE3",
      title: "Bé 3 Tuổi",
      description: "Mô tả",
      programType: "age_based",
      targetAgeMin: 3,
      targetAgeMax: 4,
      durationWeeks: 8,
      sessionsPerWeek: 3, // 24 sessions
      accessTier: "standard",
      status: "published",
      weekGoals: [],
    },
    {
      code: "CUR-J42",
      title: "Hành Trình 42 Tuần",
      description: "Mô tả 42 tuần",
      programType: "journey",
      targetAgeMin: 3,
      targetAgeMax: 6,
      durationWeeks: 42,
      sessionsPerWeek: 3, // 126 sessions (flow dài nhất)
      accessTier: "standard",
      status: "published",
      weekGoals: [],
    },
  ];

  function createMockLessons(
    count: number,
    skillCode = "C1.CNT.01"
  ): LessonSeed[] {
    return Array.from({ length: count }, (_, i) => ({
      kind: "lesson",
      header: {
        code: `LES-TEST-${String(i + 1).padStart(3, "0")}`,
        content_version: 1,
        status: "published",
        access_tier: "free",
        pedagogical_axes: {
          what_tags: ["concept"],
          thinking_tags: ["count"],
          theme_tag: "nature",
          origin: "human",
          authored_in: "repo_seed",
        },
      },
      metadata: {
        title_vi: `Bài học ${i + 1}`,
        description_vi: "Mô tả",
        target_age_min: 3,
        target_age_max: 6,
        target_skill_code: skillCode,
      },
      content_pack: {
        activities: [],
      },
    }));
  }

  function createMockGameLevels(
    skills: string[],
    levelsPerSkill = 2
  ): ContentSeed<unknown, unknown>[] {
    return skills.flatMap((sk) =>
      Array.from({ length: levelsPerSkill }, (_, idx) => ({
        kind: "game_level",
        header: {
          code: `GL-TEST-${sk}-${idx + 1}`,
          content_version: 1,
          status: "published",
          access_tier: "free",
          pedagogical_axes: {
            what_tags: ["concept"],
            thinking_tags: ["count"],
            theme_tag: "nature",
            origin: "human",
            authored_in: "repo_seed",
          },
        },
        metadata: {
          title_vi: `Level ${sk} ${idx + 1}`,
          target_age_min: 3,
          target_age_max: 6,
          target_skill_code: sk,
        },
        content_pack: {},
      }))
    );
  }

  describe("Cầu và cung tiết (BR-LCD-01, 02, 03)", () => {
    it("BR-LCD-02: Cầu tính bằng flow dài nhất (CUR-J42 = 126), không cộng dồn", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(["C1.CNT.01"], 2);

      const res = evaluateLessonSupply({
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.metrics.maxDemandSessions).toBe(126);
      expect(res.metrics.longestFlowCode).toBe("CUR-J42");
      expect(res.metrics.missingLessonCount).toBe(0);
      expect(res.isPassed).toBe(true);
    });

    it("BR-LFM-01: Một lesson xuất hiện trong nhiều flow là hợp lệ", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(["C1.CNT.01"], 2);

      const flowLessonAssignments = {
        "CUR-BE3": ["LES-TEST-001", "LES-TEST-002"],
        "CUR-J42": ["LES-TEST-001", "LES-TEST-003"], // LES-TEST-001 dùng chung
      };

      const res = evaluateLessonSupply({
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
        flowLessonAssignments,
      });

      expect(res.metrics.flowViolations.length).toBe(0);
      expect(res.isPassed).toBe(true);
    });
  });

  describe("Bốn Ca Âm Bắt Buộc (BR-LCD-09 & BR-LCD-06)", () => {
    it("Ca âm 1: Bớt 1 lesson khi thư viện sát cầu (125/126) -> ĐỎ (BR-LCD-01, 09)", () => {
      const lessons = createMockLessons(125); // Thiếu 1 lesson
      const gameLevels = createMockGameLevels(["C1.CNT.01"], 2);

      const res = evaluateLessonSupply({
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isPassed).toBe(false);
      expect(res.metrics.missingLessonCount).toBe(1);
      expect(res.violations.some((v) => v.includes("BR-LCD-01"))).toBe(true);
    });

    it("Ca âm 2: Một kỹ năng tụt xuống 1 level (1/2) -> ĐỎ (BR-LCD-10, 09)", () => {
      const lessons = createMockLessons(126, "C1.CNT.01");
      const gameLevels = createMockGameLevels(["C1.CNT.01"], 1); // Chỉ có 1 level cho C1.CNT.01

      const res = evaluateLessonSupply({
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isPassed).toBe(false);
      expect(res.metrics.skillsWithOneLevel).toContain("C1.CNT.01");
      expect(res.metrics.levelsNeeded).toBe(1);
      expect(res.violations.some((v) => v.includes("BR-LCD-10"))).toBe(true);
    });

    it("Ca âm 3: Lặp cùng một lesson 2 lần trong cùng một flow -> ĐỎ (BR-LCD-05, 09)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(["C1.CNT.01"], 2);

      const flowLessonAssignments = {
        "CUR-BE3": ["LES-TEST-001", "LES-TEST-002", "LES-TEST-001"], // Lặp LES-TEST-001
      };

      const res = evaluateLessonSupply({
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
        flowLessonAssignments,
      });

      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-LCD-05"))).toBe(true);
    });

    it("Ca âm 4: Nguồn không đọc được / rỗng -> ĐỎ, cấm giá trị mặc định (BR-LCD-06)", () => {
      const res = evaluateLessonSupply({
        curriculaConfigs: [], // Rỗng
        lessons: [],
        gameLevels: [],
      });

      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-LCD-06"))).toBe(true);
    });
  });

  describe("Báo cáo định dạng (BR-LCD-08)", () => {
    it("Báo cáo in từng chương trình kèm số buổi thiếu, cấm in phần trăm tổng", () => {
      const lessons = createMockLessons(81);
      const gameLevels = createMockGameLevels(["C1.CNT.01"], 0);

      const res = evaluateLessonSupply({
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      const report = formatLessonSupplyReport(res, mockCurricula);

      expect(report).toContain("CUR-J42");
      expect(report).toContain("CUR-BE3");
      expect(report).toContain("THIẾU TIẾT: 45");
      expect(report).not.toMatch(REGEX_PERCENT); // Cấm in phần trăm tổng
    });
  });
});
