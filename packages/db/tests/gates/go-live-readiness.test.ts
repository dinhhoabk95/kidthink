import { describe, expect, it } from "vitest";
import {
  evaluateGoLiveReadiness,
  formatGoLiveReport,
  type GoLiveConfig,
} from "#src/seed-content/gates/go-live-readiness";
import type { ContentSeed, LessonSeed } from "#src/seed-content/types";
import type { MvpCurriculumConfig } from "#src/seed-master/curricula";

describe("Cổng Điều Kiện Sẵn Sàng Go-Live — Task #125 (BR-GLR-01..09)", () => {
  const mockConfig: GoLiveConfig = {
    version: 1,
    last_updated: "2026-08-30",
    active_engines: ["GT-001", "GT-002", "GT-003"],
    thresholds: {
      engine_render_coverage_percent: 100,
      longest_flow_code: "CUR-J42",
      lesson_supply_target: 126,
      min_levels_per_skill: 2,
      content_depth_step: 0,
    },
  };

  const mockCurricula: MvpCurriculumConfig[] = [
    {
      code: "CUR-J42",
      title: "Hành Trình 42 Tuần",
      description: "Mô tả",
      programType: "journey",
      targetAgeMin: 3,
      targetAgeMax: 6,
      durationWeeks: 42,
      sessionsPerWeek: 3,
      accessTier: "standard",
      status: "published",
      weekGoals: [],
    },
  ];

  function createMockLessons(count = 126, skill = "C1.CNT.01"): LessonSeed[] {
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
        title_vi: `Bài ${i + 1}`,
        target_skill_code: skill,
      },
      content_pack: { activities: [] },
    }));
  }

  function createMockGameLevels(
    engines: string[],
    levelsPerEngine = 3,
    skill = "C1.CNT.01"
  ): ContentSeed<unknown, unknown>[] {
    return engines.flatMap((eng) =>
      Array.from({ length: levelsPerEngine }, (_, idx) => ({
        kind: "game_level",
        header: {
          code: `GL-TEST-${eng}-${idx + 1}`,
          content_version: 1,
          status: "published",
          access_tier: idx === 0 ? ("free" as const) : ("standard" as const),
          pedagogical_axes: {
            what_tags: ["concept"],
            thinking_tags: ["count"],
            theme_tag: "nature",
            origin: "human",
            authored_in: "repo_seed",
          },
        },
        metadata: {
          title_vi: `Level ${eng} ${idx + 1}`,
          game_type_id: eng,
          target_skill_code: skill,
        },
        content_pack: {},
      }))
    );
  }

  describe("Kịch bản cả hai trục đạt -> Sẵn sàng go-live", () => {
    it("BR-GLR-09: Khi cả trục game template và trục giáo án đạt -> XANH (READY)", () => {
      const lessons = createMockLessons(126, "C1.CNT.01");
      const gameLevels = createMockGameLevels(
        mockConfig.active_engines,
        3,
        "C1.CNT.01"
      );

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isGameAxisPassed).toBe(true);
      expect(res.isLessonAxisPassed).toBe(true);
      expect(res.isPassed).toBe(true);
      expect(res.violations.length).toBe(0);

      const report = formatGoLiveReport(res);
      expect(report).toContain("SẴN SÀNG GO-LIVE");
    });
  });

  describe("Bảy Ca Âm Bắt Buộc (BR-GLR-01..09)", () => {
    it("Ca âm 1: Một engine mất render() -> ĐỎ (BR-ERC-01)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(mockConfig.active_engines);

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002"], // GT-003 thiếu render
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isGameAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-ERC-01"))).toBe(true);
    });

    it("Ca âm 2: Một engine tụt dưới sàn nội dung -> ĐỎ (BR-ECD-01)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(mockConfig.active_engines);

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002"], // GT-003 thiếu sàn nội dung
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isGameAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-ECD-01"))).toBe(true);
    });

    it("Ca âm 3: Cung lesson tụt xuống 125/126 -> ĐỎ (BR-LCD-01)", () => {
      const lessons = createMockLessons(125); // Thiếu 1 lesson
      const gameLevels = createMockGameLevels(mockConfig.active_engines);

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isLessonAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-LCD-01"))).toBe(true);
    });

    it("Ca âm 4: Một kỹ năng tụt xuống 1 level (< 2) -> ĐỎ (BR-LCD-10)", () => {
      const lessons = createMockLessons(126, "C1.CNT.01");
      const gameLevels = createMockGameLevels(["GT-001"], 1, "C1.CNT.01"); // Chỉ 1 level duy nhất cho C1.CNT.01

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isLessonAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-LCD-10"))).toBe(true);
    });

    it("Ca âm 5: Trục game đạt, trục giáo án không -> ĐỎ (BR-GLR-09)", () => {
      const lessons = createMockLessons(81); // Trục giáo án chỉ có 81 lesson
      const gameLevels = createMockGameLevels(mockConfig.active_engines, 3);

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isGameAxisPassed).toBe(true);
      expect(res.isLessonAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false); // Cấm xanh khi chỉ 1 trục đạt
    });

    it("Ca âm 6: Nguồn không đọc được / rỗng -> ĐỎ, cấm giá trị mặc định (BR-GLR-06)", () => {
      const res = evaluateGoLiveReadiness({
        config: { ...mockConfig, active_engines: [] },
        activeEngineIds: [],
        implementedRenderEngineIds: [],
        depthPassingEngineIds: [],
        curriculaConfigs: [],
        lessons: [],
        gameLevels: [],
      });

      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-GLR-06"))).toBe(true);
    });

    it("Ca âm 7: Thêm engine active ngoài danh sách phạm vi -> ĐỎ (BR-GLR-05)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(mockConfig.active_engines);

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003", "GT-999"], // GT-999 ngoài scope
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(res.isGameAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-GLR-05"))).toBe(true);
    });
  });
});
