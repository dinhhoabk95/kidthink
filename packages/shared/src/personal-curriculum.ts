import { z } from "zod";
import {
  type BalanceReport,
  type CurriculumItemMetadata,
  type CurriculumWeekMetadata,
  calculateCurriculumBalance,
} from "./curriculum-model.js";
import type {
  CurriculumNextStepResult,
  CurriculumPlayerItemRef,
  CurriculumPlayerWeekGoal,
} from "./curriculum-player.js";
import type { AccessTier } from "./taxonomy-types.js";

/**
 * Zod schema cho từng item trong Personal Curriculum (Task #65 / P4.4)
 */
export const personalCurriculumItemInputSchema = z.object({
  week_no: z.number().int().min(1).max(52),
  session_no: z.number().int().min(1).max(7),
  position: z.number().int().min(1).max(20),
  entity_type: z.enum(["lesson", "game_level"]),
  entity_id: z.number().int().positive(),
  is_required: z.boolean().optional().default(true),
});

export type PersonalCurriculumItemInput = z.infer<
  typeof personalCurriculumItemInputSchema
>;

/**
 * Zod schema cho input tạo mới Personal Curriculum
 */
export const createPersonalCurriculumSchema = z.object({
  title: z.string().min(1).max(200),
  age_min: z.number().int().min(3).max(6).optional(),
  age_max: z.number().int().min(3).max(6).optional(),
  duration_weeks: z.number().int().min(1).max(52).optional().default(8),
  sessions_per_week: z.number().int().min(1).max(7).optional().default(3),
  items: z.array(personalCurriculumItemInputSchema).optional().default([]),
});

export type CreatePersonalCurriculumInput = z.input<
  typeof createPersonalCurriculumSchema
>;

/**
 * Zod schema cho input cập nhật metadata Personal Curriculum
 */
export const updatePersonalCurriculumMetaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  age_min: z.number().int().min(3).max(6).optional(),
  age_max: z.number().int().min(3).max(6).optional(),
  duration_weeks: z.number().int().min(1).max(52).optional(),
  sessions_per_week: z.number().int().min(1).max(7).optional(),
  status: z.enum(["draft", "ready"]).optional(),
  expected_version: z.number().int().positive().optional(),
});

export type UpdatePersonalCurriculumMetaInput = z.infer<
  typeof updatePersonalCurriculumMetaSchema
>;

/**
 * Zod schema cho input thay thế toàn bộ danh sách items
 */
export const replacePersonalCurriculumItemsSchema = z.object({
  items: z.array(personalCurriculumItemInputSchema),
  expected_version: z.number().int().positive().optional(),
});

export type ReplacePersonalCurriculumItemsInput = z.infer<
  typeof replacePersonalCurriculumItemsSchema
>;

/**
 * Zod schema cho input sao chép curriculum hệ thống
 */
export const copySystemCurriculumSchema = z.object({
  system_curriculum_code: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
});

export type CopySystemCurriculumInput = z.infer<
  typeof copySystemCurriculumSchema
>;

/**
 * Zod schema cho input ghi danh trẻ vào curriculum cá nhân
 */
export const enrollPersonalCurriculumSchema = z.object({
  personal_curriculum_uuid: z.string().uuid(),
});

export type EnrollPersonalCurriculumInput = z.infer<
  typeof enrollPersonalCurriculumSchema
>;

/**
 * Metadata đại diện cho một item trong Personal Curriculum
 */
export interface PersonalCurriculumItemMetadata {
  id?: number;
  personal_curriculum_id?: number;
  week_no: number;
  session_no: number;
  position: number;
  entity_type: "lesson" | "game_level";
  entity_id: number;
  code?: string;
  title_vi?: string;
  competency_code?: string;
  strand_code?: string;
  skill_codes?: string[];
  access_tier?: AccessTier;
  status?: string;
  is_required?: boolean;
  difficulty?: number;
  estimated_minutes?: number;
  is_offline?: boolean;
}

export type PersonalCurriculumItemDetail = PersonalCurriculumItemMetadata;

/**
 * Type đại diện cho Personal Curriculum tóm tắt
 */
export interface PersonalCurriculumSummary {
  id: number;
  uuid: string;
  user_id: number;
  title: string;
  age_min?: number;
  age_max?: number;
  duration_weeks: number;
  sessions_per_week: number;
  status: "draft" | "ready";
  version: number;
  item_count: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Type đại diện cho Personal Curriculum đầy đủ
 */
export interface PersonalCurriculumDetail {
  id: number;
  uuid: string;
  user_id: number;
  title: string;
  age_min?: number;
  age_max?: number;
  duration_weeks: number;
  sessions_per_week: number;
  status: "draft" | "ready";
  version: number;
  created_at: Date;
  updated_at: Date;
  items: PersonalCurriculumItemMetadata[];
  balance: BalanceReport;
  warnings: string[];
}

/**
 * Helper trích xuất cảnh báo cho lộ trình cá nhân
 */
function extractPersonalWarnings(
  baseErrors: string[],
  baseWarnings: string[],
  items: PersonalCurriculumItemMetadata[],
  durationWeeks: number
): string[] {
  const result = [...baseWarnings];

  // Convert system-level blocking errors into personal curriculum warnings
  for (const err of baseErrors) {
    result.push(`[Cảnh báo] ${err}`);
  }

  // Check for archived items explicitly (BR-PCU-07)
  for (const item of items) {
    if (item.status === "archived") {
      result.push(
        `BR-PCU-07: Hoạt động ${item.code || item.entity_id} đã bị lưu trữ (archived). Player sẽ tự động bỏ qua khi trẻ học.`
      );
    }
  }

  // Check empty weeks explicitly (BR-PCU-06)
  const populatedWeeks = new Set(items.map((i) => i.week_no));
  for (let w = 1; w <= durationWeeks; w++) {
    if (!populatedWeeks.has(w)) {
      result.push(
        `BR-PCU-06: Tuần ${w} không có hoạt động nào. Player sẽ tự động bỏ qua tuần này.`
      );
    }
  }

  return [...new Set(result)];
}

/**
 * BR-PCU-05, BR-PCU-06, BR-PCU-07:
 * Tính toán báo cáo cân bằng cho lộ trình cá nhân:
 * - Cảnh báo cân bằng không chặn trạng thái ready (BR-PCU-05).
 * - Tuần rỗng không chặn trạng thái ready, chỉ cảnh báo (BR-PCU-06).
 * - Nội dung archived / unpublished chuyển thành cảnh báo (BR-PCU-07).
 */
export function calculatePersonalCurriculumBalance(params: {
  duration_weeks: number;
  sessions_per_week: number;
  items: PersonalCurriculumItemMetadata[];
  weeks?: CurriculumWeekMetadata[];
  skill_prerequisites_map?: Record<string, string[]>;
}): { report: BalanceReport; warnings: string[] } {
  const baseReport = calculateCurriculumBalance({
    program_type: "age_based",
    duration_weeks: params.duration_weeks,
    sessions_per_week: params.sessions_per_week,
    items: params.items as CurriculumItemMetadata[],
    weeks: params.weeks,
    skill_prerequisites_map: params.skill_prerequisites_map,
  });

  const uniqueWarnings = extractPersonalWarnings(
    baseReport.errors,
    baseReport.warnings,
    params.items,
    params.duration_weeks
  );

  return {
    report: {
      ...baseReport,
      errors: [], // Personal curriculum does not block on balance rules
      warnings: uniqueWarnings,
      is_balanced: uniqueWarnings.length === 0,
    },
    warnings: uniqueWarnings,
  };
}

/**
 * Helper phân nhóm các items đang hoạt động theo tuần
 */
function groupActiveItemsByWeek(
  items: Array<CurriculumPlayerItemRef & { status?: string }>,
  durationWeeks: number
): Map<number, Array<CurriculumPlayerItemRef & { status?: string }>> {
  const activeItems = items.filter((it) => it.status !== "archived");
  const itemsByWeek = new Map<
    number,
    Array<CurriculumPlayerItemRef & { status?: string }>
  >();

  for (let w = 1; w <= durationWeeks; w++) {
    itemsByWeek.set(w, []);
  }
  for (const item of activeItems) {
    const list = itemsByWeek.get(item.week_no);
    if (list) {
      list.push(item);
    }
  }
  for (const [, list] of itemsByWeek) {
    list.sort((a, b) =>
      a.session_no === b.session_no
        ? a.position - b.position
        : a.session_no - b.session_no
    );
  }

  return itemsByWeek;
}

/**
 * Helper tính tiến độ tổng thể
 */
function computePlayerOverallProgress(
  items: Array<CurriculumPlayerItemRef & { status?: string }>,
  completedItemIds: Set<number>,
  allowedTiers: AccessTier[]
): number {
  let denominator = 0;
  let numerator = 0;
  for (const item of items) {
    if (item.status === "archived") {
      continue;
    }
    const isMandatory = item.is_required !== false;
    const isAllowed = allowedTiers.includes(item.access_tier);
    if (isMandatory && isAllowed) {
      denominator++;
      if (completedItemIds.has(item.id)) {
        numerator++;
      }
    }
  }
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;
}

interface WeekEvaluation {
  weekNo: number;
  isFinished: boolean;
  isBlockedByTier: boolean;
  doneCount: number;
  totalCount: number;
  targetItem: CurriculumPlayerItemRef | null;
}

/**
 * Helper đánh giá trạng thái một tuần
 */
function evaluateWeekState(
  w: number,
  weekItems: Array<CurriculumPlayerItemRef & { status?: string }>,
  completedItemIds: Set<number>,
  allowedTiers: AccessTier[]
): WeekEvaluation {
  const mandatoryItems = weekItems.filter((it) => it.is_required !== false);
  const mandatoryAllowedItems = mandatoryItems.filter((it) =>
    allowedTiers.includes(it.access_tier)
  );
  const completedInWeek = weekItems.filter((it) => completedItemIds.has(it.id));

  const allMandatoryAllowedCompleted =
    mandatoryAllowedItems.length > 0 &&
    mandatoryAllowedItems.every((it) => completedItemIds.has(it.id));
  const isWeekBlocked =
    mandatoryItems.length > 0 && mandatoryAllowedItems.length === 0;
  const isWeekFinished =
    allMandatoryAllowedCompleted && completedInWeek.length > 0;

  const targetItem =
    weekItems.find((it) => !completedItemIds.has(it.id)) ||
    weekItems[0] ||
    null;

  return {
    weekNo: w,
    isFinished: isWeekFinished,
    isBlockedByTier: isWeekBlocked,
    doneCount: completedInWeek.length,
    totalCount: isWeekBlocked
      ? mandatoryItems.length
      : mandatoryAllowedItems.length,
    targetItem,
  };
}

interface ActiveWeekScanResult {
  activeWeekNo: number;
  weekBlockedByTier: boolean;
  targetItem: CurriculumPlayerItemRef | null;
  activeWeekDoneCount: number;
  activeWeekTotalCount: number;
}

function scanActiveWeeks(
  durationWeeks: number,
  itemsByWeek: Map<
    number,
    Array<CurriculumPlayerItemRef & { status?: string }>
  >,
  completedItemIds: Set<number>,
  allowedTiers: AccessTier[]
): ActiveWeekScanResult {
  let activeWeekNo = 1;
  let weekBlockedByTier = false;
  let targetItem: CurriculumPlayerItemRef | null = null;
  let activeWeekDoneCount = 0;
  let activeWeekTotalCount = 0;

  for (let w = 1; w <= durationWeeks; w++) {
    const weekItems = itemsByWeek.get(w) || [];
    if (weekItems.length === 0) {
      continue;
    }

    const evalResult = evaluateWeekState(
      w,
      weekItems,
      completedItemIds,
      allowedTiers
    );

    if (evalResult.isBlockedByTier || !evalResult.isFinished) {
      activeWeekNo = w;
      weekBlockedByTier = evalResult.isBlockedByTier;
      targetItem = evalResult.targetItem;
      activeWeekDoneCount = evalResult.doneCount;
      activeWeekTotalCount = evalResult.totalCount;
      break;
    }

    if (w === durationWeeks && evalResult.isFinished) {
      activeWeekNo = w;
      activeWeekDoneCount = evalResult.doneCount;
      activeWeekTotalCount = evalResult.totalCount;
      targetItem = null;
    }
  }

  return {
    activeWeekNo,
    weekBlockedByTier,
    targetItem,
    activeWeekDoneCount,
    activeWeekTotalCount,
  };
}

/**
 * BR-PCU-04, BR-PCU-06, BR-PCU-07 & D-P4M:
 * Player logic dùng chung với policy cho Personal Curriculum:
 * - Bỏ qua tuần rỗng (skip empty weeks).
 * - Bỏ qua item archived (skip archived items).
 * - Giữ nguyên tiến độ và logic tier lock (không serve locked).
 */
export function resolvePersonalCurriculumNextStep(params: {
  durationWeeks: number;
  weeks?: CurriculumPlayerWeekGoal[];
  items: Array<CurriculumPlayerItemRef & { status?: string }>;
  completedItemIds: Set<number>;
  allowedTiers: AccessTier[];
}): CurriculumNextStepResult {
  const { durationWeeks, items, completedItemIds, allowedTiers } = params;

  const itemsByWeek = groupActiveItemsByWeek(items, durationWeeks);
  const progress = computePlayerOverallProgress(
    items,
    completedItemIds,
    allowedTiers
  );

  const {
    activeWeekNo,
    weekBlockedByTier,
    targetItem,
    activeWeekDoneCount,
    activeWeekTotalCount,
  } = scanActiveWeeks(
    durationWeeks,
    itemsByWeek,
    completedItemIds,
    allowedTiers
  );

  const isCompleted = targetItem === null && !weekBlockedByTier;
  const isLocked =
    weekBlockedByTier ||
    (targetItem !== null && !allowedTiers.includes(targetItem.access_tier));

  return {
    week_no: activeWeekNo,
    session_no: targetItem?.session_no ?? 1,
    item: targetItem
      ? {
          entity_type: targetItem.entity_type,
          entity_code: targetItem.code || String(targetItem.entity_id),
          title_vi: targetItem.title_vi,
          locked: isLocked,
          access_tier: targetItem.access_tier,
        }
      : null,
    week_progress: {
      done: activeWeekDoneCount,
      total: activeWeekTotalCount,
    },
    curriculum_progress: progress,
    week_blocked_by_tier: weekBlockedByTier,
    is_completed: isCompleted,
  };
}
