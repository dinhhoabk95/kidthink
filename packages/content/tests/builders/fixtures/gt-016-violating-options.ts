import type { GT016ClockOption } from "../helpers/gt-016-rules";

/** Vi phạm BR-E016-04: bậc 60 mà có phương án giờ rưỡi. */
export const STEP_60_WITH_HALF_HOUR_OPTION: readonly GT016ClockOption[] = [
  { hour: 3, minute: 0, is_correct: true },
  { hour: 5, minute: 30, is_correct: false },
  { hour: 9, minute: 0, is_correct: false },
];

/** Vi phạm BR-E016-04: bậc 30 mà không có bẫy cùng giờ khác phút. */
export const STEP_30_WITHOUT_SAME_HOUR_TRAP: readonly GT016ClockOption[] = [
  { hour: 3, minute: 0, is_correct: true },
  { hour: 5, minute: 30, is_correct: false },
  { hour: 9, minute: 0, is_correct: false },
];
