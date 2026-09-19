import type { RoundRunner } from "@mindkid/game-engine";

/**
 * Danh tính của một vòng chơi: runner đã mở nó cộng chỉ số vòng.
 *
 * Bề mặt chơi có ba hành động trễ — câu dẫn phát sau tiếng chuông mở vòng,
 * settle khi câu dẫn đọc xong, và tự sang vòng sau khi thắng. Cả ba từng đọc
 * biến `roundRunner` **hiện hành** lúc chạy, nên hẹn giờ của vòng N có thể
 * đóng hoặc mở cổng của vòng N+1, hay của lượt chơi mới sau khi bấm chơi lại
 * (Task #274, E2 và E6). Mỗi hành động trễ phải mang token của vòng đã sinh ra
 * nó và tự huỷ khi token không còn hiện hành.
 */
export interface RoundToken {
  readonly runner: RoundRunner;
  readonly roundIndex: number;
}

export function captureRoundToken(runner: RoundRunner): RoundToken {
  return { runner, roundIndex: runner.getState().currentRoundIndex };
}

export function isRoundTokenCurrent(
  token: RoundToken,
  current: RoundRunner | null
): boolean {
  if (current !== token.runner) {
    return false;
  }
  const state = current.getState();
  return !state.isFinished && state.currentRoundIndex === token.roundIndex;
}

/** Bọc `fn` để nó chỉ chạy khi vòng của `token` vẫn là vòng đang mở. */
export function bindToRound(
  token: RoundToken,
  getRunner: () => RoundRunner | null,
  fn: () => void
): () => void {
  return () => {
    if (isRoundTokenCurrent(token, getRunner())) {
      fn();
    }
  };
}

export interface TimerBag {
  set(fn: () => void, delayMs: number): void;
  /** Huỷ mọi hẹn giờ đang chờ — gọi khi rời trang và khi bắt đầu lượt mới. */
  clearAll(): void;
}

export function createTimerBag(): TimerBag {
  const pending = new Set<ReturnType<typeof setTimeout>>();
  return {
    set(fn, delayMs) {
      const id = setTimeout(() => {
        pending.delete(id);
        fn();
      }, delayMs);
      pending.add(id);
    },
    clearAll() {
      for (const id of pending) {
        clearTimeout(id);
      }
      pending.clear();
    },
  };
}

/**
 * Hẹn đóng vòng vừa thắng sau nhịp ăn mừng. Chỉ đóng đúng vòng đã thắng: nếu
 * trong lúc chờ vòng đã đổi (bỏ qua, chơi lại, rời trang) thì không làm gì.
 */
export function scheduleWonRoundCompletion(
  timers: TimerBag,
  getRunner: () => RoundRunner | null,
  delayMs: number
): void {
  const runner = getRunner();
  if (!runner) {
    return;
  }
  const token = captureRoundToken(runner);
  timers.set(
    bindToRound(token, getRunner, () => {
      token.runner.completeCurrentRound();
    }),
    delayMs
  );
}

export interface RoundOpenNarrationOptions {
  readonly timers: TimerBag;
  readonly getRunner: () => RoundRunner | null;
  /** Chờ tiếng chuông mở vòng dứt rồi mới đọc. */
  readonly delayMs: number;
  /** Phát câu dẫn; gọi tham số `settle` khi đọc xong (hoặc quá hạn). */
  readonly play: (settle: () => void) => void;
  /** Mở cổng cử chỉ và bắt đầu đồng hồ vòng (`BR-PNR-11`). */
  readonly onSettled: () => void;
}

/**
 * Câu dẫn mở vòng: phát sau nhịp chuông, và chỉ mở cổng của **chính** vòng
 * đã hẹn nó. Vòng đổi trước nhịp chuông thì không phát; vòng đổi trước khi
 * đọc xong thì settle bị bỏ qua (Task #274, E6).
 */
export function scheduleRoundOpenNarration(
  options: RoundOpenNarrationOptions
): void {
  const { timers, getRunner, delayMs, play, onSettled } = options;
  const runner = getRunner();
  if (!runner) {
    return;
  }
  const token = captureRoundToken(runner);
  const settle = bindToRound(token, getRunner, onSettled);
  timers.set(
    bindToRound(token, getRunner, () => play(settle)),
    delayMs
  );
}

/**
 * Bỏ qua vòng hiện tại — trừ khi trẻ đã thắng nó và vòng chỉ đang chờ nhịp ăn
 * mừng. Trả `false` khi không bỏ qua.
 */
export function skipCurrentRoundIfUnwon(
  runner: RoundRunner,
  reason: "scaffold_exhausted" | "user" | "retry_disallowed"
): boolean {
  if (runner.isCurrentRoundWon()) {
    return false;
  }
  runner.skipCurrentRound(reason);
  return true;
}
