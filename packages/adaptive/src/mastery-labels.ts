export const REPORT_MASTERY_THRESHOLDS = {
  MIN_ATTEMPTS: 3,
  INTRODUCTORY: 0.35,
  DEVELOPING: 0.6,
  STABLE: 0.8,
} as const;

export type MasteryLabel =
  | "Chưa có đủ dữ liệu"
  | "Mới làm quen"
  | "Đang phát triển"
  | "Khá ổn định"
  | "Thành thạo trong phạm vi bài tập";

export const FORBIDDEN_DIAGNOSTIC_WORDS = [
  "chậm",
  "kém",
  "có vấn đề",
  "iq",
  "rối loạn",
  "bệnh lý",
] as const;

export const FORBIDDEN_PREDICTIVE_WORDS = [
  "sẽ đạt",
  "dự kiến",
  "tiên lượng",
  "tương lai sẽ",
  "chắc chắn sẽ",
] as const;

export const FORBIDDEN_NORMATIVE_WORDS = [
  "so với tuổi",
  "chuẩn độ tuổi",
  "trung bình của trẻ cùng tuổi",
  "so với trẻ khác",
  "so với bạn",
  "dưới chuẩn",
] as const;

export const ALL_FORBIDDEN_REPORT_WORDS = [
  ...FORBIDDEN_DIAGNOSTIC_WORDS,
  ...FORBIDDEN_PREDICTIVE_WORDS,
  ...FORBIDDEN_NORMATIVE_WORDS,
] as const;

/**
 * BR-ARP-01, BR-ARP-05, BR-ARP-07, BR-REP-01
 * Validates text against all forbidden diagnostic, predictive, and normative words.
 */
export function validateReportLanguage(text: string): {
  valid: boolean;
  violations: string[];
} {
  const lower = text.toLowerCase();
  const violations = ALL_FORBIDDEN_REPORT_WORDS.filter((word) =>
    lower.includes(word)
  );
  return {
    valid: violations.length === 0,
    violations: [...violations],
  };
}

export const ADVANCED_REPORT_THRESHOLDS = {
  MIN_COMPETENCY_SESSIONS: 5,
  MIN_STRAND_SESSIONS: 3,
  MIN_SKILL_SESSIONS: 3,
  MIN_WEEKS_DATA: 3,
  MIN_INDEPENDENCE_SESSIONS: 10,
  MIN_REINFORCE_SESSIONS: 3,
  MIN_READY_SESSIONS: 3,
  REINFORCE_P_LEARN_CEILING: 0.4,
  READY_P_LEARN_FLOOR: 0.8,
} as const;

export type TrendDirection = "improving" | "steady" | "needs_attention";
export type SectionStatus = "ready" | "insufficient_data";

export function determineTrendDirection(trendDelta: number): TrendDirection {
  if (trendDelta > 0.05) {
    return "improving";
  }
  if (trendDelta < -0.05) {
    return "needs_attention";
  }
  return "steady";
}

export function trendDirectionDescription(direction: TrendDirection): string {
  switch (direction) {
    case "improving":
      return "Mức độ hoàn thành và nhịp hoạt động của bé đang tăng trưởng tích cực.";
    case "needs_attention":
      return "Bé có sự chững lại trong nhịp chơi hoặc tỉ lệ hoàn thành, cần người lớn đồng hành củng cố.";
    default:
      return "Nhịp tham gia và hoạt động của bé duy trì ổn định qua các tuần.";
  }
}

/**
 * BR-PRG-08 & spec §7.4
 * Standardized mapping from p_learn and attempts to a non-diagnostic Vietnamese label.
 */
export function masteryLabel(params: {
  p_learn: number;
  attempts_total: number;
}): MasteryLabel {
  if (params.attempts_total < REPORT_MASTERY_THRESHOLDS.MIN_ATTEMPTS) {
    return "Chưa có đủ dữ liệu";
  }

  if (params.p_learn < REPORT_MASTERY_THRESHOLDS.INTRODUCTORY) {
    return "Mới làm quen";
  }

  if (params.p_learn < REPORT_MASTERY_THRESHOLDS.DEVELOPING) {
    return "Đang phát triển";
  }

  if (params.p_learn < REPORT_MASTERY_THRESHOLDS.STABLE) {
    return "Khá ổn định";
  }

  return "Thành thạo trong phạm vi bài tập";
}
