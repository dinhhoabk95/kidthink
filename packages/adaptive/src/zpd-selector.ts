import type { MasteryState } from "./bkt.js";

export const ZPD_THRESHOLDS = {
  LOW: 0.4,
  HIGH: 0.8,
  INACTIVE_DAYS: 7,
  MIN_ATTEMPTS: 3,
} as const;

export type ZpdAction =
  | "initial_assessment"
  | "repeat_or_easier"
  | "same_difficulty_variant"
  | "step_up_one_difficulty";

export interface NextSuggestion {
  action: ZpdAction;
  revision_mode: boolean;
  recommended_difficulty_delta: number;
  reason: string;
}

export interface CurriculumStepContext {
  week_no: number;
  session_no: number;
  position: number;
  skill_ids?: number[];
}

interface StepMasterySummary {
  minPLearn: number;
  minAttempts: number;
  oldestLastSeen: Date | null;
  hasData: boolean;
}

function collectStepMasterySummary(
  skillIds: number[],
  mastery: Map<number, MasteryState>
): StepMasterySummary {
  let minPLearn = 1.0;
  let minAttempts = 999;
  let oldestLastSeen: Date | null = null;
  let hasData = false;

  for (const sid of skillIds) {
    const m = mastery.get(sid);
    if (m) {
      hasData = true;
      if (m.p_learn < minPLearn) {
        minPLearn = m.p_learn;
      }
      if (m.attempts_total < minAttempts) {
        minAttempts = m.attempts_total;
      }
      if (!oldestLastSeen || m.last_seen_at < oldestLastSeen) {
        oldestLastSeen = m.last_seen_at;
      }
    }
  }

  return { minPLearn, minAttempts, oldestLastSeen, hasData };
}

function checkRevisionMode(oldestLastSeen: Date | null, now: Date): boolean {
  if (!oldestLastSeen) {
    return false;
  }
  const elapsedDays =
    (now.getTime() - oldestLastSeen.getTime()) / (1000 * 60 * 60 * 24);
  return elapsedDays > ZPD_THRESHOLDS.INACTIVE_DAYS;
}

function resolveActionFromScore(
  minPLearn: number,
  isRevisionMode: boolean
): NextSuggestion {
  if (minPLearn < ZPD_THRESHOLDS.LOW) {
    return {
      action: "repeat_or_easier",
      revision_mode: isRevisionMode,
      recommended_difficulty_delta: -1,
      reason: "Mastery dưới 0.4, gợi ý lặp lại hoặc biến thể dễ hơn",
    };
  }

  if (minPLearn < ZPD_THRESHOLDS.HIGH) {
    return {
      action: "same_difficulty_variant",
      revision_mode: isRevisionMode,
      recommended_difficulty_delta: 0,
      reason: "Mastery 0.4 - 0.8, giữ nguyên độ khó và chọn biến thể khác",
    };
  }

  return {
    action: "step_up_one_difficulty",
    revision_mode: isRevisionMode,
    recommended_difficulty_delta: 1,
    reason: "Mastery >= 0.8, gợi ý nâng 1 bậc độ khó trong cùng bước",
  };
}

/**
 * BR-ADP-05, BR-ADP-08, BR-ADP-09, D-MM
 * Pure function to select next adaptive action within current curriculum step.
 * If step is null (free play / off-curriculum), returns null per D-MM (owned by P3.6).
 */
export function selectNext(params: {
  tree?: unknown;
  mastery: Map<number, MasteryState>;
  step: CurriculumStepContext | null;
  now: Date;
}): NextSuggestion | null {
  if (!params.step) {
    return null;
  }

  const skillIds = params.step.skill_ids ?? [];
  const summary = collectStepMasterySummary(skillIds, params.mastery);
  const isRevisionMode = checkRevisionMode(summary.oldestLastSeen, params.now);

  if (!summary.hasData || summary.minAttempts < ZPD_THRESHOLDS.MIN_ATTEMPTS) {
    return {
      action: "initial_assessment",
      revision_mode: isRevisionMode,
      recommended_difficulty_delta: 0,
      reason: "Trẻ chưa có đủ dữ liệu chơi, áp dụng độ khó chuẩn",
    };
  }

  return resolveActionFromScore(summary.minPLearn, isRevisionMode);
}
