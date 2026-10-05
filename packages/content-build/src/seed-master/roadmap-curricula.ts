/**
 * Chương trình học và dãy item sinh thẳng từ lộ trình soạn và sổ cầu.
 *
 * Không có phép chọn nội dung ở đây: lộ trình nêu tiết, sổ cầu nêu nội dung
 * lấp tiết, phần này chỉ đổi dạng.
 */

import type { RoadmapAccessTier, RoadmapSeed } from "@mindkid/content";
import { ALL_ROADMAPS } from "@mindkid/content";
import type { ContentDemandLedger } from "#src/gates/content-demand";
import { BAND_AGES } from "#src/gates/roadmap-seed-gate";

export interface MvpCurriculumConfig {
  code: string;
  title: string;
  description: string;
  programType: "age_based" | "journey";
  targetAgeMin: number;
  targetAgeMax: number;
  durationWeeks: number;
  sessionsPerWeek: number;
  accessTier: RoadmapAccessTier;
  status: "draft" | "in_review" | "approved" | "published";
  weekGoals: string[];
}

export interface RoadmapCurriculumConfig extends MvpCurriculumConfig {
  contentVersion: number;
}

export interface CurriculumItemPlan {
  readonly curriculumCode: string;
  readonly weekNo: number;
  readonly sessionNo: number;
  readonly position: number;
  readonly entityType: "lesson" | "game_level";
  readonly contentCode: string;
  readonly isRequired: boolean;
}

// Cột `curricula.code` bắt buộc khuôn `CUR-*`; mã lộ trình giữ nguyên bên
// trong để suy ngược được.
const CURRICULUM_CODE_PREFIX = "CUR-";

export function curriculumCodeForRoadmap(roadmapCode: string): string {
  return `${CURRICULUM_CODE_PREFIX}${roadmapCode}`;
}

export function roadmapToCurriculumConfig(
  roadmap: RoadmapSeed
): RoadmapCurriculumConfig {
  const [ageMin, ageMax] = BAND_AGES[roadmap.band];
  return {
    code: curriculumCodeForRoadmap(roadmap.code),
    title: roadmap.title,
    description: roadmap.description,
    programType: "age_based",
    targetAgeMin: ageMin,
    targetAgeMax: ageMax,
    durationWeeks: roadmap.duration_weeks,
    sessionsPerWeek: roadmap.sessions_per_week,
    accessTier: roadmap.access_tier,
    status: "published",
    weekGoals: roadmap.weeks.map((week) => week.goal),
    contentVersion: roadmap.version,
  };
}

export const ROADMAP_CURRICULA_CONFIGS: RoadmapCurriculumConfig[] =
  ALL_ROADMAPS.map(roadmapToCurriculumConfig);

export function planCurriculumItems(
  ledger: ContentDemandLedger
): CurriculumItemPlan[] {
  return ledger.cells.flatMap((cell) =>
    cell.filled_by.map<CurriculumItemPlan>((contentCode, index) => ({
      curriculumCode: curriculumCodeForRoadmap(cell.roadmap_code),
      weekNo: cell.week_no,
      sessionNo: cell.session_no,
      position: index + 1,
      entityType: cell.role === "practice" ? "game_level" : "lesson",
      contentCode,
      isRequired: true,
    }))
  );
}

export interface ResolvedCurriculumItem extends CurriculumItemPlan {
  readonly entityId: number;
}

export function resolveCurriculumItems(
  plan: readonly CurriculumItemPlan[],
  idByCode: {
    readonly lesson: ReadonlyMap<string, number>;
    readonly game_level: ReadonlyMap<string, number>;
  }
): ResolvedCurriculumItem[] {
  const missing: string[] = [];
  const resolved: ResolvedCurriculumItem[] = [];
  for (const item of plan) {
    const entityId = idByCode[item.entityType].get(item.contentCode);
    if (entityId === undefined) {
      missing.push(`${item.entityType}:${item.contentCode}`);
      continue;
    }
    resolved.push({ ...item, entityId });
  }
  if (missing.length > 0) {
    throw new Error(
      `Sổ cầu nêu nội dung chưa có trong database: ${[...new Set(missing)].join(", ")}. Gieo nội dung trước bước item.`
    );
  }
  return resolved;
}

export interface ExistingItemKey {
  readonly id: number;
  readonly weekNo: number;
  readonly sessionNo: number;
  readonly position: number;
}

export function findStaleItemIds(
  existing: readonly ExistingItemKey[],
  wanted: readonly CurriculumItemPlan[]
): number[] {
  const keep = new Set(
    wanted.map((item) => `${item.weekNo}:${item.sessionNo}:${item.position}`)
  );
  return existing
    .filter(
      (row) => !keep.has(`${row.weekNo}:${row.sessionNo}:${row.position}`)
    )
    .map((row) => row.id);
}
