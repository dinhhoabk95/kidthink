/**
 * Nhịp của chuỗi bàn tay ma (Task #313): mỗi bước chiếm đúng một chu kỳ
 * `cycleMs`, hết bước cuối thì lặp lại từ bước đầu. Hàm thuần theo đồng hồ khung
 * (`now` do vòng vẽ truyền vào) — không đọc `Date.now`.
 */
export interface GhostHandFrame {
  /** Bước đang diễn (0-based). */
  readonly step: number;
  /** Tiến độ trong bước, 0 → 1. */
  readonly progress: number;
}

export function resolveGhostHandFrame(
  stepCount: number,
  cycleMs: number,
  now: number
): GhostHandFrame {
  const steps = Math.max(1, Math.floor(stepCount));
  const inLoop = now % (cycleMs * steps);
  const step = Math.min(steps - 1, Math.floor(inLoop / cycleMs));
  return { step, progress: (inLoop - step * cycleMs) / cycleMs };
}
