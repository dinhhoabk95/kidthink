/**
 * Cổng cân bằng lộ trình (BR-LRM-06) cho các chương trình gieo bằng phép gán
 * của seeder cũ.
 *
 * Chạy `validateCurriculumModel` (BR-CRM-*) trên đúng dãy item mà seeder sẽ
 * ghi vào `curriculum_items`. Cổng gọi `selectCurriculumSlot` — cùng hàm
 * seeder gọi — trên hai kho nguồn theo thứ tự gieo, nên số đo của cổng là số
 * đo của seeder thật, không cần database.
 *
 * `validateCurriculumModel` hạ BR-CRM-02/03/08 xuống cảnh báo. Với seeder, ba
 * luật này là điều kiện chặn: một chương trình theo tuổi chỉ dạy C1 là lỗi sư
 * phạm, không phải khuyến nghị. BR-CRM-05 và BR-CRM-01 chỉ đo được trên lộ
 * trình soạn (tiết có vai trò và kỹ năng), xem `roadmap-seed-gate`.
 */

import type { CurriculumItemMetadata } from "@mindkid/shared";
import {
  CURRICULUM_POOL_LIMIT,
  type CurriculumPoolEntry,
  MVP_CURRICULA_CONFIGS,
  type MvpCurriculumConfig,
  resolveCurriculumWeekGoal,
  selectCurriculumSlot,
} from "../seed-master/curricula.js";
import type { ContentSeed, LessonSeed } from "../types.js";
import {
  LEGACY_BLOCKING_WARNING_RULES,
  measureCurriculum,
  type RoadmapBalanceReport,
  type RoadmapProgramRow,
  summarizeRows,
} from "./roadmap-measure.js";

export type {
  RoadmapBalanceReport,
  RoadmapProgramRow,
  RoadmapRuleId,
  RoadmapViolation,
} from "./roadmap-measure.js";

export interface RoadmapBalanceInput {
  readonly programs: readonly MvpCurriculumConfig[];
  readonly lessons: readonly LessonSeed[];
  readonly levels: readonly ContentSeed[];
}

// Lesson và game_level là hai chuỗi id riêng trong database; cổng gộp chúng
// vào một mảng item nên dịch id level đi để BR-CRM-09 không nhầm hai thực thể.
const LEVEL_ENTITY_ID_OFFSET = 1_000_000;

function buildPool(
  seeds: ReadonlyArray<{ readonly header: { readonly code: string } }>,
  idOffset: number
): CurriculumPoolEntry[] {
  return seeds.slice(0, CURRICULUM_POOL_LIMIT).map((seed, index) => ({
    id: idOffset + index + 1,
    code: seed.header.code,
  }));
}

function indexSkills(
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): Map<string, { skill_codes: string[]; difficulty?: number }> {
  const byCode = new Map<
    string,
    { skill_codes: string[]; difficulty?: number }
  >();
  for (const lesson of lessons) {
    byCode.set(lesson.header.code, {
      skill_codes: [...lesson.header.skill_codes],
    });
  }
  for (const level of levels) {
    byCode.set(level.header.code, {
      skill_codes: [...level.header.skill_codes],
      difficulty: level.header.difficulty,
    });
  }
  return byCode;
}

export function simulateCurriculumItems(
  program: MvpCurriculumConfig,
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): CurriculumItemMetadata[] {
  const lessonsList = buildPool(lessons, 0);
  const levelsList = buildPool(levels, LEVEL_ENTITY_ID_OFFSET);
  const metaByCode = indexSkills(lessons, levels);
  const items: CurriculumItemMetadata[] = [];

  for (let weekNo = 1; weekNo <= program.durationWeeks; weekNo++) {
    for (let sessionNo = 1; sessionNo <= program.sessionsPerWeek; sessionNo++) {
      const selection = selectCurriculumSlot({
        weekNo,
        sessionNo,
        sessionsPerWeek: program.sessionsPerWeek,
        lessonsList,
        levelsList,
      });
      if (!selection) {
        continue;
      }
      const meta = metaByCode.get(selection.entity.code);
      items.push({
        week_no: weekNo,
        session_no: sessionNo,
        position: 1,
        entity_type: selection.entityType,
        entity_id: selection.entity.id,
        code: selection.entity.code,
        is_required: true,
        skill_codes: meta?.skill_codes,
        difficulty: meta?.difficulty,
      });
    }
  }
  return items;
}

function measureProgram(
  program: MvpCurriculumConfig,
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): RoadmapProgramRow {
  return measureCurriculum(
    program.code,
    {
      code: program.code,
      program_type: program.programType,
      target_age_min: program.targetAgeMin,
      target_age_max: program.targetAgeMax,
      duration_weeks: program.durationWeeks,
      sessions_per_week: program.sessionsPerWeek,
      title: program.title,
      access_tier: program.accessTier,
      status: program.status,
      items: simulateCurriculumItems(program, lessons, levels),
      weeks: Array.from({ length: program.durationWeeks }, (_, index) => ({
        week_no: index + 1,
        goal: resolveCurriculumWeekGoal(program, index + 1),
      })),
    },
    LEGACY_BLOCKING_WARNING_RULES
  );
}

export function evaluateRoadmapBalance(
  input: RoadmapBalanceInput
): RoadmapBalanceReport {
  return summarizeRows(
    input.programs
      .filter((program) => program.status === "published")
      .map((program) => measureProgram(program, input.lessons, input.levels))
  );
}

export function evaluateSeededRoadmapBalance(
  lessons: readonly LessonSeed[],
  levels: readonly ContentSeed[]
): RoadmapBalanceReport {
  return evaluateRoadmapBalance({
    programs: MVP_CURRICULA_CONFIGS,
    lessons,
    levels,
  });
}
