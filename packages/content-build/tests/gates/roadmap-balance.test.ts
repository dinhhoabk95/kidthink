import { describe, expect, it, vi } from "vitest";
import { ALL_SEED_LESSONS, SHIPPABLE_SEED_LEVELS } from "#src/catalog";
import {
  evaluateRoadmapBalance,
  evaluateSeededRoadmapBalance,
  type RoadmapRuleId,
  simulateCurriculumItems,
} from "#src/gates/roadmap-balance";
import {
  formatRoadmapBalanceReport,
  listRoadmapViolations,
} from "#src/gates/roadmap-measure";
import {
  CURRICULUM_POOL_LIMIT,
  MVP_CURRICULA_CONFIGS,
  type MvpCurriculumConfig,
  selectCurriculumSlot,
} from "#src/seed-master/curricula";
import type { ContentSeed, LessonSeed } from "#src/types";

vi.mock("@mindkid/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@mindkid/db")>()),
  getOwnerDb: vi.fn(),
}));

const WEEKS = 8;
const SESSIONS = 3;
const COMPETENCY_COUNT = 6;
const FIXTURE_POOL_SIZE = 30;

function requireFirst<T>(list: readonly T[], label: string): T {
  const first = list[0];
  if (first === undefined) {
    throw new Error(`Kho ${label} rỗng`);
  }
  return first;
}

const BASE_LESSON: LessonSeed = requireFirst(ALL_SEED_LESSONS, "bài học");
const BASE_LEVEL: ContentSeed = requireFirst(SHIPPABLE_SEED_LEVELS, "level");

const BALANCED_PROGRAM: MvpCurriculumConfig = {
  code: "CUR-FIXTURE",
  title: "Chương trình thử",
  description: "Chương trình thử cho cổng cân bằng",
  programType: "age_based",
  targetAgeMin: 3,
  targetAgeMax: 4,
  durationWeeks: WEEKS,
  sessionsPerWeek: SESSIONS,
  accessTier: "standard",
  status: "published",
  weekGoals: Array.from({ length: WEEKS }, (_, i) => `Mục tiêu tuần ${i + 1}`),
};

interface SlotPosition {
  readonly weekNo: number;
  readonly sessionNo: number;
  readonly poolIndex: number;
  readonly kind: "lesson" | "game_level";
}

type SkillAssigner = (position: SlotPosition) => string;

function fixtureCode(kind: "lesson" | "game_level", index: number): string {
  return `${kind === "lesson" ? "LES" : "GL"}-FIXTURE-${index}`;
}

function fixturePositions(): SlotPosition[] {
  const placeholder = (kind: "lesson" | "game_level") =>
    Array.from({ length: FIXTURE_POOL_SIZE }, (_, i) => ({
      id: i + 1,
      code: fixtureCode(kind, i),
    }));
  const lessonsList = placeholder("lesson");
  const levelsList = placeholder("game_level");
  const positions: SlotPosition[] = [];
  for (let weekNo = 1; weekNo <= WEEKS; weekNo++) {
    for (let sessionNo = 1; sessionNo <= SESSIONS; sessionNo++) {
      const selection = selectCurriculumSlot({
        weekNo,
        sessionNo,
        sessionsPerWeek: SESSIONS,
        lessonsList,
        levelsList,
      });
      if (selection) {
        positions.push({
          weekNo,
          sessionNo,
          poolIndex: selection.entity.id - 1,
          kind: selection.entityType,
        });
      }
    }
  }
  return positions;
}

function buildPools(assign: SkillAssigner): {
  lessons: LessonSeed[];
  levels: ContentSeed[];
} {
  const lessons: LessonSeed[] = Array.from(
    { length: FIXTURE_POOL_SIZE },
    (_, i) => ({
      ...BASE_LESSON,
      header: {
        ...BASE_LESSON.header,
        code: fixtureCode("lesson", i),
        skill_codes: ["C1.FILL.00"],
      },
    })
  );
  const levels: ContentSeed[] = Array.from(
    { length: FIXTURE_POOL_SIZE },
    (_, i) => ({
      ...BASE_LEVEL,
      header: {
        ...BASE_LEVEL.header,
        code: fixtureCode("game_level", i),
        difficulty: 2,
        skill_codes: ["C1.FILL.00"],
      },
    })
  );
  for (const position of fixturePositions()) {
    const skill = assign(position);
    if (position.kind === "lesson") {
      const seed = lessons[position.poolIndex];
      if (seed) {
        lessons[position.poolIndex] = {
          ...seed,
          header: { ...seed.header, skill_codes: [skill] },
        };
      }
    } else {
      const seed = levels[position.poolIndex];
      if (seed) {
        levels[position.poolIndex] = {
          ...seed,
          header: { ...seed.header, skill_codes: [skill] },
        };
      }
    }
  }
  return { lessons, levels };
}

function slotOrdinal(position: SlotPosition): number {
  return (position.weekNo - 1) * SESSIONS + (position.sessionNo - 1);
}

// Vòng sáu competency theo thứ tự tiết: mỗi tuần chạm 3 competency, mỗi
// competency đúng 4/24 item; mỗi kỹ năng xuất hiện lần đầu trước tuần 3 cuối và
// được gặp lại trong hai tuần kế.
const balancedSkill: SkillAssigner = (position) =>
  `C${(slotOrdinal(position) % COMPETENCY_COUNT) + 1}.FIX.01`;

// Mỗi tuần dạy đúng một competency.
const onePerWeekSkill: SkillAssigner = (position) =>
  `C${(position.weekNo % COMPETENCY_COUNT) + 1}.FIX.01`;

// Cả chương trình chỉ dạy C1.
const onlyC1Skill: SkillAssigner = () => "C1.FIX.01";

// Mỗi tiết một kỹ năng riêng nên không kỹ năng nào được ôn lại.
const neverReviewedSkill: SkillAssigner = (position) =>
  `C${(slotOrdinal(position) % COMPETENCY_COUNT) + 1}.FIX.${String(slotOrdinal(position) + 1).padStart(2, "0")}`;

function ruleIds(
  program: MvpCurriculumConfig,
  assign: SkillAssigner
): RoadmapRuleId[] {
  const { lessons, levels } = buildPools(assign);
  const report = evaluateRoadmapBalance({
    programs: [program],
    lessons,
    levels,
  });
  return listRoadmapViolations(report).map((v) => v.rule_id);
}

describe("check:roadmap-balance — cổng cân bằng lộ trình (BR-LRM-06)", () => {
  describe("seeder thật", () => {
    const report = evaluateSeededRoadmapBalance(
      ALL_SEED_LESSONS,
      SHIPPABLE_SEED_LEVELS
    );

    it("ĐỎ trên cả 5 chương trình published đang gieo", () => {
      expect(report.passed).toBe(false);
      expect(report.programs.map((p) => p.program_code)).toEqual(
        MVP_CURRICULA_CONFIGS.map((p) => p.code)
      );
      expect(report.violating_programs).toBe(MVP_CURRICULA_CONFIGS.length);
    });

    it("đo đúng các số của bảng vi phạm ở BR-CRM-02/07/08", () => {
      const byCode = new Map(report.programs.map((p) => [p.program_code, p]));
      for (const code of ["CUR-BE3", "CUR-BE4", "CUR-BE5", "CUR-BE6"]) {
        const row = byCode.get(code);
        expect(row?.weeks_off_range).toBe(8);
        expect(row?.max_share).toBe(1);
        expect(row?.competencies_covered).toBe(1);
        expect(row?.late_new_skills).toBeGreaterThan(0);
      }
      const journey = byCode.get("CUR-J42");
      expect(journey?.weeks_off_range).toBe(22);
      expect(journey?.max_share).toBeCloseTo(0.683, 3);
      expect(journey?.competencies_covered).toBe(4);
    });

    it("in một hàng bảng cho mỗi chương trình", () => {
      const lines = formatRoadmapBalanceReport(report);
      expect(lines).toHaveLength(2 + report.programs.length);
      expect(lines.at(-1)).toContain("CUR-J42");
    });

    it("dãy item mô phỏng khớp phép gán của seeder", () => {
      const program = MVP_CURRICULA_CONFIGS[0];
      if (!program) {
        throw new Error("thiếu chương trình");
      }
      const items = simulateCurriculumItems(
        program,
        ALL_SEED_LESSONS,
        SHIPPABLE_SEED_LEVELS
      );
      expect(items).toHaveLength(
        program.durationWeeks * program.sessionsPerWeek
      );
      expect(CURRICULUM_POOL_LIMIT).toBe(100);
      const first = items[0];
      expect(first?.entity_type).toBe("lesson");
      expect(first?.code).toBe(
        ALL_SEED_LESSONS[(1 * 3 + 1) % CURRICULUM_POOL_LIMIT]?.header.code
      );
      expect(items[1]?.entity_type).toBe("game_level");
    });
  });

  describe("ca âm — sửa cho thoả thì xanh, vi phạm thì đỏ", () => {
    it("xanh: lộ trình cân bằng đủ BR-CRM-02/03/07/08/11", () => {
      const { lessons, levels } = buildPools(balancedSkill);
      const report = evaluateRoadmapBalance({
        programs: [BALANCED_PROGRAM],
        lessons,
        levels,
      });
      expect(listRoadmapViolations(report)).toEqual([]);
      expect(report.passed).toBe(true);
    });

    it("cùng chương trình CUR-BE3: kho nguồn thật đỏ, kho cân bằng xanh", () => {
      const program = MVP_CURRICULA_CONFIGS[0];
      if (!program) {
        throw new Error("thiếu chương trình");
      }
      const real = evaluateRoadmapBalance({
        programs: [program],
        lessons: ALL_SEED_LESSONS,
        levels: SHIPPABLE_SEED_LEVELS,
      });
      const { lessons, levels } = buildPools(balancedSkill);
      const fixed = evaluateRoadmapBalance({
        programs: [program],
        lessons,
        levels,
      });
      expect(real.passed).toBe(false);
      expect(fixed.passed).toBe(true);
    });

    it("đỏ BR-CRM-07 và BR-CRM-08 khi chỉ dạy một competency", () => {
      const ids = ruleIds(BALANCED_PROGRAM, onlyC1Skill);
      expect(ids).toContain("BR-CRM-07");
      expect(ids).toContain("BR-CRM-08");
      expect(ids).toContain("BR-CRM-02");
    });

    it("đỏ BR-CRM-02 khi mỗi tuần chỉ chạm một competency", () => {
      expect(ruleIds(BALANCED_PROGRAM, onePerWeekSkill)).toContain("BR-CRM-02");
    });

    it("đỏ BR-CRM-03 khi kỹ năng mới không được ôn lại", () => {
      expect(ruleIds(BALANCED_PROGRAM, neverReviewedSkill)).toContain(
        "BR-CRM-03"
      );
    });

    it("đỏ BR-CRM-11 khi kỹ năng mới xuất hiện ở ba tuần cuối", () => {
      expect(ruleIds(BALANCED_PROGRAM, neverReviewedSkill)).toContain(
        "BR-CRM-11"
      );
    });

    it("không đo chương trình chưa published", () => {
      const { lessons, levels } = buildPools(onlyC1Skill);
      const report = evaluateRoadmapBalance({
        programs: [{ ...BALANCED_PROGRAM, status: "draft" }],
        lessons,
        levels,
      });
      expect(report.programs).toHaveLength(0);
      expect(report.passed).toBe(true);
    });
  });

  describe("seed-all dừng trước khi chạm database", () => {
    it("ném lỗi và không mở kết nối khi cổng đỏ", async () => {
      const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
      const { getOwnerDb } = await import("@mindkid/db");
      const { seedAllContent } = await import("#src/cli/seed-all");
      await expect(seedAllContent()).rejects.toThrow("check:roadmap-balance");
      expect(getOwnerDb).not.toHaveBeenCalled();
      log.mockRestore();
    });
  });
});
