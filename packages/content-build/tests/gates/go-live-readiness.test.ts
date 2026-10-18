import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  evaluateGoLiveReadiness,
  formatGoLiveReport,
  type GoLiveConfig,
  loadGoLiveConfig,
} from "#src/gates/go-live-readiness";
import type { MvpCurriculumConfig } from "#src/seed-master/roadmap-curricula";
import type { ContentSeed, LessonSeed } from "#src/types";

describe("Cổng Điều Kiện Sẵn Sàng Go-Live — Task #125 & #310 (BR-GLR-01..09)", () => {
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
        title: `Bài ${i + 1}`,
        guide: {
          outcome: "Kết quả mong đợi",
          preparation: ["Chuẩn bị"],
          opening: "Bắt đầu bài học",
          if_child_succeeds: "Khen ngợi trẻ",
          if_child_needs_help: "Hướng dẫn từng bước",
        },
        target_age_min: 3,
        target_age_max: 6,
        estimated_minutes: 15,
        access_tier: "free",
        skill_codes: [skill],
        learning_objective_codes: [],
        activity_codes: [],
        what_tags: ["concept"],
        thinking_tags: ["count"],
        theme_tag: "nature",
        origin: "human",
        authored_in: "repo_seed",
      },
    }));
  }

  function createMockGameLevels(
    engines: string[],
    levelsPerEngine = 3,
    skill = "C1.CNT.01"
  ): ContentSeed[] {
    return engines.flatMap((eng) => {
      const tpl = ALL_TEMPLATES[eng];
      const ageMin = tpl?.age_min ?? 4;
      const ageMax = tpl?.age_max ?? 5;
      return Array.from({ length: levelsPerEngine }, (_, idx) => ({
        kind: "game_level",
        header: {
          code: `GL-TEST-${eng}-${idx + 1}`,
          content_version: 1,
          template_code: eng,
          title: `Level ${eng} ${idx + 1}`,
          instruction: "Bé hãy thử nhé",
          age_min: ageMin,
          age_max: ageMax,
          difficulty: 1,
          access_tier: idx === 0 ? ("free" as const) : ("standard" as const),
          skill_codes: [skill],
          learning_objective_codes: [],
          what_tags: ["concept"],
          thinking_tags: ["count"],
          theme_tag: "nature",
          origin: "human",
          authored_in: "repo_seed",
        },
        content_pack: {},
        difficulty_params: {},
      }));
    });
  }

  describe("Kịch bản cả hai trục đạt -> Sẵn sàng go-live", () => {
    it("BR-GLR-04, BR-GLR-07, BR-GLR-08, BR-GLR-09: Khi cả hai trục đạt -> XANH, đếm động số engine và kèm lưu ý BR-GLR-07", () => {
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
      expect(report).toContain("3/3 engine đạt sàn nội dung bậc 0 (BR-ECD-01)");
      expect(report).not.toContain("27/27 engine");
      expect(report).toContain("BR-GLR-07");

      const liveConfig = loadGoLiveConfig();
      const allTemplateIds = Object.keys(ALL_TEMPLATES).sort();
      expect([...liveConfig.active_engines].sort()).toEqual(allTemplateIds);
    });
  });

  describe("Các Ca Âm Bắt Buộc (BR-GLR-01..09)", () => {
    it("Ca âm 1: Vượt sàn MVP 120 level (228 level) nhưng thiếu render() -> ĐỎ (BR-GLR-01 / BR-ERC-01)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(mockConfig.active_engines, 76); // 228 levels > 120 MVP floor

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002"], // GT-003 thiếu render
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels,
      });

      expect(gameLevels.length).toBe(228);
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

    it("Ca âm 7: Thêm engine active hoặc level ngoài danh sách phạm vi -> ĐỎ (BR-GLR-05)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels([
        ...mockConfig.active_engines,
        "GT-014",
      ]);

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

    it("Ca âm 8: Level có content_pack không khớp content_contract -> ĐỎ (BR-GLR-02 / BR-GTC-10)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(mockConfig.active_engines);
      const first = gameLevels[0];
      if (!first) {
        throw new Error("Expected at least one mock game level");
      }
      const brokenLevels: ContentSeed[] = [
        {
          ...first,
          content_pack: { invalid_corrupted_field: "broken" },
        },
        ...gameLevels.slice(1),
      ];

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels: brokenLevels,
      });

      expect(res.isGameAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-GLR-02"))).toBe(true);
    });

    it("Ca âm 9: Level gắn theme_tag ngoài từ vựng đóng hoặc sai band tuổi -> ĐỎ (BR-CTR-01 / BR-ECD-13)", () => {
      const lessons = createMockLessons(126);
      const gameLevels = createMockGameLevels(mockConfig.active_engines);
      const first = gameLevels[0];
      if (!first) {
        throw new Error("Expected at least one mock game level");
      }
      const badThemeAndBandLevels: ContentSeed[] = [
        {
          ...first,
          header: {
            ...first.header,
            age_min: 1,
            age_max: 9,
            theme_tag: "invalid_theme_xyz",
          },
        },
        ...gameLevels.slice(1),
      ];

      const res = evaluateGoLiveReadiness({
        config: mockConfig,
        activeEngineIds: ["GT-001", "GT-002", "GT-003"],
        implementedRenderEngineIds: ["GT-001", "GT-002", "GT-003"],
        depthPassingEngineIds: ["GT-001", "GT-002", "GT-003"],
        curriculaConfigs: mockCurricula,
        lessons,
        gameLevels: badThemeAndBandLevels,
      });

      expect(res.isGameAxisPassed).toBe(false);
      expect(res.isPassed).toBe(false);
      expect(res.violations.some((v) => v.includes("BR-CTR-01"))).toBe(true);
      expect(res.violations.some((v) => v.includes("BR-ECD-13"))).toBe(true);
    });
  });
});
