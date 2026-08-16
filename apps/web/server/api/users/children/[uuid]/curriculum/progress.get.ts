import { AppError } from "@kidthink/auth";
import {
  type AccessTier,
  type CurriculumPlayerItemRef,
  type CurriculumPlayerWeekGoal,
  computeCurriculumProgress,
} from "@kidthink/shared";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../../utils/auth-runtime.js";
import { resolveEnrolledChildCurriculum } from "../../../../../utils/curriculum-runtime.js";

interface WeekItemSummary {
  id: number;
  week_no: number;
  session_no: number;
  position: number;
  entity_type: "lesson" | "game_level";
  entity_id: number;
  code: string;
  title: string;
  is_required: boolean;
  access_tier: AccessTier;
  locked: boolean;
  is_completed: boolean;
}

interface WeekSummary {
  week_no: number;
  goal: string;
  is_unlocked: boolean;
  is_completed: boolean;
  is_blocked_by_tier: boolean;
  done_items: number;
  total_mandatory_items: number;
  items: WeekItemSummary[];
}

function evaluateSingleWeekSummary(params: {
  weekNo: number;
  weekGoal: string;
  weekItems: CurriculumPlayerItemRef[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
  isWeekUnlocked: boolean;
}): { weekSummary: WeekSummary; isCompletedForNext: boolean } {
  const {
    weekNo,
    weekGoal,
    weekItems,
    completedItemIds,
    userAllowedTiers,
    isWeekUnlocked,
  } = params;

  const sortedItems = weekItems
    .slice()
    .sort((a, b) =>
      a.session_no === b.session_no
        ? a.position - b.position
        : a.session_no - b.session_no
    );

  const mandatoryItems = sortedItems.filter((i) => i.is_required !== false);
  const mandatoryAllowedItems = mandatoryItems.filter((i) =>
    userAllowedTiers.includes(i.access_tier)
  );
  const completedInWeek = sortedItems.filter((i) => completedItemIds.has(i.id));

  const isBlockedByTier =
    mandatoryItems.length > 0 && mandatoryAllowedItems.length === 0;

  const isWeekCompleted =
    mandatoryAllowedItems.length > 0
      ? mandatoryAllowedItems.every((i) => completedItemIds.has(i.id)) &&
        completedInWeek.length > 0
      : mandatoryItems.length === 0 && sortedItems.length === 0;

  const weekSummary: WeekSummary = {
    week_no: weekNo,
    goal: weekGoal,
    is_unlocked: isWeekUnlocked,
    is_completed: isWeekCompleted,
    is_blocked_by_tier: isBlockedByTier,
    done_items: completedInWeek.length,
    total_mandatory_items: mandatoryAllowedItems.length,
    items: sortedItems.map((item) => ({
      id: item.id,
      week_no: item.week_no,
      session_no: item.session_no,
      position: item.position,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      code: item.code ?? "",
      title: item.title ?? "",
      is_required: item.is_required !== false,
      access_tier: item.access_tier,
      locked: !userAllowedTiers.includes(item.access_tier),
      is_completed: completedItemIds.has(item.id),
    })),
  };

  return {
    weekSummary,
    isCompletedForNext: isWeekCompleted && !isBlockedByTier,
  };
}

function buildWeekBreakdown(params: {
  durationWeeks: number;
  items: CurriculumPlayerItemRef[];
  weeks: CurriculumPlayerWeekGoal[];
  completedItemIds: Set<number>;
  userAllowedTiers: AccessTier[];
}): { weekBreakdown: WeekSummary[]; currentActiveWeek: number } {
  const { durationWeeks, items, weeks, completedItemIds, userAllowedTiers } =
    params;

  const weekGoalMap = new Map<number, string>();
  for (const w of weeks) {
    if (w.goal) {
      weekGoalMap.set(w.week_no, w.goal);
    }
  }

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

  const weekBreakdown: WeekSummary[] = [];
  let previousWeekCompleted = true;
  let currentActiveWeek = 1;

  for (let w = 1; w <= durationWeeks; w++) {
    const weekItems = itemsByWeek.get(w) || [];
    const isWeekUnlocked = w === 1 || previousWeekCompleted;
    const weekGoal = weekGoalMap.get(w) || `Tuần ${w}`;

    const { weekSummary, isCompletedForNext } = evaluateSingleWeekSummary({
      weekNo: w,
      weekGoal,
      weekItems,
      completedItemIds,
      userAllowedTiers,
      isWeekUnlocked,
    });

    if (
      isWeekUnlocked &&
      !weekSummary.is_completed &&
      currentActiveWeek === 1
    ) {
      currentActiveWeek = w;
    }

    previousWeekCompleted = isCompletedForNext;
    weekBreakdown.push(weekSummary);
  }

  return { weekBreakdown, currentActiveWeek };
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const userId = Number(user.user_id);

    // 1. Resolve child, enrollment, items, weeks, completed items, and user tiers
    const {
      child,
      enrollment,
      items,
      weeks,
      completedItemIds,
      userAllowedTiers,
    } = await resolveEnrolledChildCurriculum(event, userId, uuid, {
      requireActive: false,
    });

    // 2. Compute overall progress (BR-CUR-07 & D-MD)
    const { denominator, numerator, progress } = computeCurriculumProgress({
      items,
      completedItemIds,
      allowedTiers: userAllowedTiers,
    });

    // 3. Build week breakdown
    const { weekBreakdown, currentActiveWeek } = buildWeekBreakdown({
      durationWeeks: enrollment.duration_weeks,
      items,
      weeks,
      completedItemIds,
      userAllowedTiers,
    });

    return {
      enrollment_id: enrollment.id,
      curriculum_code: enrollment.curriculum_code,
      curriculum_version: enrollment.curriculum_version,
      curriculum_title: enrollment.curriculum_title,
      child_uuid: child.uuid,
      child_display_name: child.displayName,
      duration_weeks: enrollment.duration_weeks,
      sessions_per_week: enrollment.sessions_per_week,
      status: enrollment.status,
      current_week: currentActiveWeek,
      progress,
      numerator,
      denominator,
      total_items: items.length,
      completed_items: completedItemIds.size,
      is_completed: enrollment.status === "completed" || progress >= 1.0,
      weeks: weekBreakdown,
    };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number };
    if (errorObj?.statusCode) {
      setResponseStatus(event, errorObj.statusCode);
      throw err;
    }
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
