export interface GT016ClockOption {
  readonly hour: number;
  readonly minute: number;
  readonly is_correct: boolean;
}

/** Kiểm BR-E016-04; trả về danh sách vi phạm (rỗng = hợp lệ). */
export function findGT016Violations(
  minuteStep: 30 | 60,
  options: readonly GT016ClockOption[]
): string[] {
  const violations: string[] = [];
  if (minuteStep === 60) {
    for (const option of options) {
      if (option.minute !== 0) {
        violations.push(`bậc 60 có phương án ${option.hour}:${option.minute}`);
      }
    }
    return violations;
  }
  const target = options.find((option) => option.is_correct);
  const hasTrap = options.some(
    (option) =>
      !option.is_correct &&
      target !== undefined &&
      option.hour === target.hour &&
      option.minute !== target.minute
  );
  if (!hasTrap) {
    violations.push("bậc 30 thiếu bẫy cùng giờ khác phút");
  }
  return violations;
}
