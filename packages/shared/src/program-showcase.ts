/**
 * Spec sở hữu: docs/specs/02-public/program-showcase.md
 * Business rules: BR-PSH-01..07, D-NF..D-NL
 */

import { COMPETENCY_CATALOG } from "./competency-catalog.js";
import type { AccessTier } from "./taxonomy-types.js";

export type ShowcaseGroup = "age" | "journey" | "competency" | "topic";

export interface ProgramCardPublic {
  code: string;
  title: string;
  description: string;
  group: ShowcaseGroup;
  target_age: {
    min: number;
    max: number;
  };
  duration_weeks: number;
  sessions_per_week: number;
  access_tier: AccessTier;
}

export interface ProgramWeekItemPublic {
  entity_type: "lesson" | "game_level";
  code: string;
  title: string;
  estimated_minutes: number;
  access_tier: AccessTier;
}

export interface ProgramWeekPublic {
  week_no: number;
  goal: string;
  session_count: number;
  item_count: number;
  items?: ProgramWeekItemPublic[];
}

export interface ProgramCompetencyShare {
  code: string;
  label: string;
  share: number;
}

export interface ProgramDetailPublic extends ProgramCardPublic {
  competency_distribution: ProgramCompetencyShare[];
  weeks: ProgramWeekPublic[];
}

export interface ProgramGroupPublic {
  code: ShowcaseGroup;
  label: string;
  programs: ProgramCardPublic[];
}

export interface ProgramListPublicResponse {
  groups: ProgramGroupPublic[];
}

export interface ProgramAlternativeSuggestion {
  code: string;
  title: string;
  access_tier: AccessTier;
  target_age: {
    min: number;
    max: number;
  };
}

export interface ProgramArchivedResponse {
  code: string;
  suggestions: ProgramAlternativeSuggestion[];
}

/**
 * Nhãn năng lực cho trang chương trình — dẫn xuất từ `COMPETENCY_CATALOG`.
 *
 * Bảng viết tay ở đây là bản sao **thứ sáu** của sáu năng lực (task 165).
 */
export const COMPETENCY_LABELS: Record<string, string> = Object.fromEntries(
  COMPETENCY_CATALOG.map((entry) => [entry.code, entry.name])
);

export const SHOWCASE_GROUP_LABELS: Record<ShowcaseGroup, string> = {
  age: "Chương trình theo độ tuổi",
  journey: "Hành trình phát triển toàn diện",
  competency: "Chương trình theo năng lực trọng tâm",
  topic: "Chuyên đề sẵn sàng vào lớp 1",
};

export function mapProgramTypeToShowcaseGroup(
  programType?: string | null
): ShowcaseGroup {
  if (programType === "journey") {
    return "journey";
  }
  if (programType === "competency") {
    return "competency";
  }
  if (programType === "topic") {
    return "topic";
  }
  return "age";
}

export interface RawCurriculumRecord {
  code: string;
  title?: string | null;
  description?: string | null;
  programType?: string | null;
  group?: ShowcaseGroup | null;
  targetAgeMin?: number | null;
  targetAgeMax?: number | null;
  target_age?: { min: number; max: number } | null;
  durationWeeks?: number | null;
  duration_weeks?: number | null;
  sessionsPerWeek?: number | null;
  sessions_per_week?: number | null;
  accessTier?: AccessTier | string | null;
  access_tier?: AccessTier | string | null;
}

export interface RawCurriculumWeekRecord {
  weekNo: number;
  goal?: string | null;
}

export interface RawCurriculumItemRecord {
  weekNo: number;
  sessionNo: number;
  position?: number | null;
  entityType: "lesson" | "game_level" | string;
  code?: string | null;
  title?: string | null;
  estimatedMinutes?: number | null;
  accessTier?: AccessTier | string | null;
}

export interface ProgramCourseSeoData {
  code: string;
  title: string;
  description?: string;
  target_age: { min: number; max: number };
  duration_weeks: number;
  access_tier?: string;
}

export function buildCourseJsonLd(
  program: ProgramCourseSeoData,
  siteUrl = "https://mindkid.vn"
) {
  const isFree = program.access_tier === "free";
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: program.title,
    description:
      program.description ||
      `Chương trình phát triển tư duy ${program.duration_weeks} tuần cho trẻ ${program.target_age.min}–${program.target_age.max} tuổi`,
    courseCode: program.code,
    educationalLevel: `Trẻ mầm non ${program.target_age.min}–${program.target_age.max} tuổi`,
    inLanguage: "vi-VN",
    isAccessibleForFree: isFree,
    provider: {
      "@type": "Organization",
      name: "MindKid",
      url: siteUrl,
    },
    url: `${siteUrl}/programs/${program.code}`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      duration: `P${program.duration_weeks}W`,
    },
  };
}

function extractTargetAge(record: RawCurriculumRecord): {
  min: number;
  max: number;
} {
  let min = 3;
  if (typeof record.target_age?.min === "number" && record.target_age.min > 0) {
    min = record.target_age.min;
  } else if (
    typeof record.targetAgeMin === "number" &&
    record.targetAgeMin > 0
  ) {
    min = record.targetAgeMin;
  }

  let max = 6;
  if (
    typeof record.target_age?.max === "number" &&
    record.target_age.max >= min
  ) {
    max = record.target_age.max;
  } else if (
    typeof record.targetAgeMax === "number" &&
    record.targetAgeMax >= min
  ) {
    max = record.targetAgeMax;
  }

  return { min, max };
}

function extractDurationWeeks(record: RawCurriculumRecord): number {
  if (typeof record.duration_weeks === "number" && record.duration_weeks > 0) {
    return record.duration_weeks;
  }
  if (typeof record.durationWeeks === "number" && record.durationWeeks > 0) {
    return record.durationWeeks;
  }
  return 8;
}

function extractSessionsPerWeek(record: RawCurriculumRecord): number {
  if (
    typeof record.sessions_per_week === "number" &&
    record.sessions_per_week > 0
  ) {
    return record.sessions_per_week;
  }
  if (
    typeof record.sessionsPerWeek === "number" &&
    record.sessionsPerWeek > 0
  ) {
    return record.sessionsPerWeek;
  }
  return 3;
}

/**
 * BR-PSH-01 & D-NF:
 * Pure allow-list projection for ProgramCardPublic.
 * Strictly no object spread, no internal DB identifiers.
 */
export function toProgramCardPublic(
  record: RawCurriculumRecord
): ProgramCardPublic {
  return {
    code: String(record.code || ""),
    title: String(record.title || ""),
    description: String(record.description || ""),
    group: record.group || mapProgramTypeToShowcaseGroup(record.programType),
    target_age: extractTargetAge(record),
    duration_weeks: extractDurationWeeks(record),
    sessions_per_week: extractSessionsPerWeek(record),
    access_tier:
      ((record.access_tier || record.accessTier) as AccessTier) || "free",
  };
}

/**
 * BR-PSH-01, BR-PSH-02, BR-PSH-03, D-NF, D-NH:
 * Pure allow-list projection for ProgramDetailPublic.
 * Weeks 1-2 include item metadata (code, title, entity_type, minutes, tier).
 * Weeks 3+ strictly omit items array.
 * Absolutely NO content_pack, guide, instruction, materials, or internal IDs.
 */
export function toProgramDetailPublic(params: {
  curriculum: RawCurriculumRecord;
  weeks: RawCurriculumWeekRecord[];
  items: RawCurriculumItemRecord[];
  competencyDistribution?: ProgramCompetencyShare[];
}): ProgramDetailPublic {
  const card = toProgramCardPublic(params.curriculum);
  const itemsByWeek = new Map<number, RawCurriculumItemRecord[]>();

  for (const item of params.items) {
    const list = itemsByWeek.get(item.weekNo) || [];
    list.push(item);
    itemsByWeek.set(item.weekNo, list);
  }

  const durationWeeks = card.duration_weeks;
  const publicWeeks: ProgramWeekPublic[] = [];

  for (let w = 1; w <= durationWeeks; w++) {
    const weekMeta = params.weeks.find((wk) => wk.weekNo === w);
    const weekItems = itemsByWeek.get(w) || [];

    const distinctSessions = new Set(weekItems.map((i) => i.sessionNo));
    const sessionCount =
      distinctSessions.size > 0
        ? distinctSessions.size
        : card.sessions_per_week;

    const weekPublic: ProgramWeekPublic = {
      week_no: w,
      goal: String(weekMeta?.goal || `Mục tiêu phát triển tư duy tuần ${w}`),
      session_count: sessionCount,
      item_count: weekItems.length,
    };

    // BR-PSH-02 & D-NH: Only weeks 1-2 include item details
    if (w <= 2) {
      weekPublic.items = weekItems.map((item) => {
        const entityType =
          item.entityType === "lesson" ? "lesson" : "game_level";
        const defaultMinutes = entityType === "lesson" ? 20 : 10;
        return {
          entity_type: entityType,
          code: String(item.code || ""),
          title: String(item.title || "Hoạt động học"),
          estimated_minutes: Number(item.estimatedMinutes || defaultMinutes),
          access_tier:
            (item.accessTier as AccessTier) || card.access_tier || "free",
        };
      });
    }

    publicWeeks.push(weekPublic);
  }

  return {
    code: card.code,
    title: card.title,
    description: card.description,
    group: card.group,
    target_age: {
      min: card.target_age.min,
      max: card.target_age.max,
    },
    duration_weeks: card.duration_weeks,
    sessions_per_week: card.sessions_per_week,
    access_tier: card.access_tier,
    competency_distribution: params.competencyDistribution || [],
    weeks: publicWeeks,
  };
}

export const FORBIDDEN_PUBLIC_KEYS = [
  "content_pack",
  "contentPack",
  "guide",
  "instruction",
  "materials",
  "entity_id",
  "entityId",
  "seed_batch_id",
  "seedBatchId",
  "created_by_manager_id",
  "createdByManagerId",
  "reviewed_by_manager_id",
  "reviewedByManagerId",
  "storage_path",
  "storagePath",
  "internal_notes",
] as const;

function scanArray(
  arr: unknown[],
  currentPath: string,
  forbiddenList: readonly string[]
): { found: boolean; forbiddenKey?: string; path?: string } {
  for (let i = 0; i < arr.length; i++) {
    const res = scanValue(arr[i], `${currentPath}[${i}]`, forbiddenList);
    if (res.found) {
      return res;
    }
  }
  return { found: false };
}

function scanObject(
  record: Record<string, unknown>,
  currentPath: string,
  forbiddenList: readonly string[]
): { found: boolean; forbiddenKey?: string; path?: string } {
  for (const key of Object.keys(record)) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key;
    if (forbiddenList.includes(key)) {
      return { found: true, forbiddenKey: key, path: nextPath };
    }
    const res = scanValue(record[key], nextPath, forbiddenList);
    if (res.found) {
      return res;
    }
  }
  return { found: false };
}

function scanValue(
  val: unknown,
  currentPath: string,
  forbiddenList: readonly string[]
): { found: boolean; forbiddenKey?: string; path?: string } {
  if (!val || typeof val !== "object") {
    return { found: false };
  }
  if (Array.isArray(val)) {
    return scanArray(val, currentPath, forbiddenList);
  }
  return scanObject(val as Record<string, unknown>, currentPath, forbiddenList);
}

/**
 * Deep audit function to ensure no forbidden internal/content fields leak out.
 */
export function hasForbiddenPublicKeys(
  obj: unknown,
  forbiddenList: readonly string[] = FORBIDDEN_PUBLIC_KEYS
): { found: boolean; forbiddenKey?: string; path?: string } {
  return scanValue(obj, "", forbiddenList);
}
