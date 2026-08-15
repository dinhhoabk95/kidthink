import type { AccessTier } from "./taxonomy-types.js";

export interface CurriculumPlayerItemRef {
  id: number;
  curriculum_id: number;
  week_no: number;
  session_no: number;
  position: number;
  entity_type: "lesson" | "game_level";
  entity_id: number;
  code?: string;
  title_vi?: string;
  is_required?: boolean;
  access_tier: AccessTier;
}

export interface CurriculumPlayerWeekGoal {
  week_no: number;
  goal?: string;
}

export interface NextStepItemPayload {
  entity_type: "lesson" | "game_level";
  entity_code: string;
  title_vi?: string;
  locked: boolean;
  access_tier: AccessTier;
}

export interface CurriculumNextStepResult {
  week_no: number;
  session_no: number;
  item: NextStepItemPayload | null;
  week_progress: {
    done: number;
    total: number;
  };
  curriculum_progress: number;
  week_blocked_by_tier: boolean;
  is_completed: boolean;
  next_curriculum_suggestion?: string;
}

export interface CurriculumProgressCalculationResult {
  denominator: number;
  numerator: number;
  progress: number;
}

/**
 * BR-CUR-07 & D-MD:
 * Tính tiến độ lộ trình động theo tier hiện tại của người dùng.
 * - Mẫu số (denominator): Chỉ tính các item BẮT BUỘC (is_required !== false)
 *   và NẰM TRONG TIER MỞ ĐƯỢC (allowedTiers).
 * - Tử số (numerator): Số item bắt buộc mở được đã hoàn thành.
 * - Khi nâng gói (tier upgrade): Mẫu số mở rộng, tiến độ tính lại tại thời điểm đọc.
 */
export function computeCurriculumProgress(params: {
  items: CurriculumPlayerItemRef[];
  completedItemIds: Set<number>;
  allowedTiers: AccessTier[];
}): CurriculumProgressCalculationResult {
  const { items, completedItemIds, allowedTiers } = params;

  let denominator = 0;
  let numerator = 0;

  for (const item of items) {
    const isMandatory = item.is_required !== false;
    const isAllowed = allowedTiers.includes(item.access_tier);

    if (isMandatory && isAllowed) {
      denominator++;
      if (completedItemIds.has(item.id)) {
        numerator++;
      }
    }
  }

  const progress =
    denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;
  return { denominator, numerator, progress };
}

function groupAndSortItemsByWeek(
  durationWeeks: number,
  items: CurriculumPlayerItemRef[]
): Map<number, CurriculumPlayerItemRef[]> {
  const itemsByWeek = new Map<number, CurriculumPlayerItemRef[]>();
  for (let w = 1; w <= durationWeeks; w++) {
    itemsByWeek.set(w, []);
  }
  for (const item of items) {
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

interface SingleWeekEvaluation {
  isWeekBlocked: boolean;
  isWeekFinished: boolean;
  targetItem: CurriculumPlayerItemRef | null;
  doneCount: number;
  totalCount: number;
}

function evaluateWeekItems(
  weekItems: CurriculumPlayerItemRef[],
  completedItemIds: Set<number>,
  allowedTiers: AccessTier[]
): SingleWeekEvaluation {
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
    (allMandatoryAllowedCompleted && completedInWeek.length > 0) ||
    (mandatoryItems.length === 0 && weekItems.length === 0);

  let targetItem: CurriculumPlayerItemRef | null = null;
  if (isWeekBlocked) {
    targetItem =
      weekItems.find((it) => !completedItemIds.has(it.id)) ||
      weekItems[0] ||
      null;
  } else if (!isWeekFinished) {
    targetItem = weekItems.find((it) => !completedItemIds.has(it.id)) || null;
  }

  const totalCount = isWeekBlocked
    ? mandatoryItems.length
    : mandatoryAllowedItems.length;

  return {
    isWeekBlocked,
    isWeekFinished,
    targetItem,
    doneCount: completedInWeek.length,
    totalCount,
  };
}

interface EvaluatedWeekState {
  activeWeekNo: number;
  weekBlockedByTier: boolean;
  targetItem: CurriculumPlayerItemRef | null;
  activeWeekDoneCount: number;
  activeWeekTotalCount: number;
}

function findActiveWeek(
  durationWeeks: number,
  itemsByWeek: Map<number, CurriculumPlayerItemRef[]>,
  completedItemIds: Set<number>,
  allowedTiers: AccessTier[]
): EvaluatedWeekState {
  let activeWeekNo = 1;
  let weekBlockedByTier = false;
  let targetItem: CurriculumPlayerItemRef | null = null;
  let activeWeekDoneCount = 0;
  let activeWeekTotalCount = 0;

  for (let w = 1; w <= durationWeeks; w++) {
    const weekItems = itemsByWeek.get(w) || [];
    const evaluation = evaluateWeekItems(
      weekItems,
      completedItemIds,
      allowedTiers
    );

    if (evaluation.isWeekBlocked || !evaluation.isWeekFinished) {
      activeWeekNo = w;
      weekBlockedByTier = evaluation.isWeekBlocked;
      targetItem = evaluation.targetItem;
      activeWeekDoneCount = evaluation.doneCount;
      activeWeekTotalCount = evaluation.totalCount;
      break;
    }

    if (w === durationWeeks && evaluation.isWeekFinished) {
      activeWeekNo = w;
      activeWeekDoneCount = evaluation.doneCount;
      activeWeekTotalCount = evaluation.totalCount;
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

function buildItemPayload(
  targetItem: CurriculumPlayerItemRef | null,
  allowedTiers: AccessTier[]
): { itemPayload: NextStepItemPayload | null; sessionNo: number } {
  if (!targetItem) {
    return { itemPayload: null, sessionNo: 1 };
  }
  const isLocked = !allowedTiers.includes(targetItem.access_tier);
  return {
    sessionNo: targetItem.session_no,
    itemPayload: {
      entity_type: targetItem.entity_type,
      entity_code:
        targetItem.code || `${targetItem.entity_type}_${targetItem.entity_id}`,
      title_vi: targetItem.title_vi,
      locked: isLocked,
      access_tier: targetItem.access_tier,
    },
  };
}

/**
 * BR-CUR-01, 03, 05, 08, 09, 10 & D-MG:
 * Xác định bước kế tiếp và trạng thái mở khoá các tuần.
 */
export function resolveNextStep(params: {
  durationWeeks: number;
  weeks?: CurriculumPlayerWeekGoal[];
  items: CurriculumPlayerItemRef[];
  completedItemIds: Set<number>;
  allowedTiers: AccessTier[];
}): CurriculumNextStepResult {
  const { durationWeeks, items, completedItemIds, allowedTiers } = params;

  const { progress } = computeCurriculumProgress({
    items,
    completedItemIds,
    allowedTiers,
  });

  const itemsByWeek = groupAndSortItemsByWeek(durationWeeks, items);
  const {
    activeWeekNo,
    weekBlockedByTier,
    targetItem,
    activeWeekDoneCount,
    activeWeekTotalCount,
  } = findActiveWeek(
    durationWeeks,
    itemsByWeek,
    completedItemIds,
    allowedTiers
  );

  const isCompleted = targetItem === null && !weekBlockedByTier;
  const { itemPayload, sessionNo } = buildItemPayload(targetItem, allowedTiers);

  return {
    week_no: activeWeekNo,
    session_no: sessionNo,
    item: itemPayload,
    week_progress: {
      done: activeWeekDoneCount,
      total: activeWeekTotalCount,
    },
    curriculum_progress: progress,
    week_blocked_by_tier: weekBlockedByTier,
    is_completed: isCompleted,
    next_curriculum_suggestion: isCompleted ? "CUR-J42" : undefined,
  };
}

/**
 * D-MF: Chỗ nối adaptive.
 * P3.4 trả về chính item, đảm bảo không thể đổi (week_no, session_no, position).
 * P3.5 sẽ thay thế phần thân để chọn biến thể.
 */
export function selectVariant<
  T extends { week_no: number; session_no: number; position: number },
>(item: T, _context?: unknown): T {
  return { ...item };
}
