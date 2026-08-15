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
] as const;

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
