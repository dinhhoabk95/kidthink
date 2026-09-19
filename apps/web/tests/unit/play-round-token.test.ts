import {
  type ActionResult,
  BaseGameSession,
  type GameAction,
  type NarrationTrigger,
  type RoundConfig,
  RoundRunner,
} from "@mindkid/game-engine";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bindToRound,
  captureRoundToken,
  createTimerBag,
  scheduleWonRoundCompletion,
  skipCurrentRoundIfUnwon,
} from "~/composables/play/play-round-token";

class WinnableSession extends BaseGameSession {
  setupEntities(): void {
    /* noop */
  }
  validateAction(_a: GameAction): ActionResult {
    return { valid: true, feedback: "none" };
  }
  checkWinCondition(): boolean {
    return this.isWon;
  }
  win(): void {
    this.isWon = true;
  }
}

function makeRound(roundIndex: number): RoundConfig {
  return {
    round_index: roundIndex,
    content_pack: { prompt: `Câu hỏi vòng ${roundIndex + 1}` },
    difficulty_params: { item_count: 2 },
  };
}

function makeRunner(
  onPlayNarration?: (config: RoundConfig, trigger: NarrationTrigger) => void
): RoundRunner {
  return new RoundRunner({
    rounds: [makeRound(0), makeRound(1), makeRound(2)],
    sessionFactory: () => new WinnableSession(),
    gateOnPromptSettle: true,
    onPlayNarration: onPlayNarration ?? (() => undefined),
  });
}

function winCurrentRound(runner: RoundRunner): void {
  const session = runner.getCurrentSession();
  if (!(session instanceof WinnableSession)) {
    throw new Error("Thiếu session của vòng hiện tại");
  }
  session.win();
}

const ADVANCE_MS = 900;

/**
 * Hành động trễ của bề mặt chơi (tự sang vòng sau khi thắng, câu dẫn trễ
 * 600ms, settle câu dẫn) phải neo vào đúng runner + vòng đã sinh ra nó
 * (Task #274, E2 và E6). Không neo thì một hẹn giờ của vòng N đóng hoặc mở
 * cổng của vòng N+1.
 */
describe("play-round-token — hành động trễ neo vào vòng (Task #274 S1b, S1e)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nhiều vòng: thắng vòng 1 → vòng 2 mở và câu dẫn vòng 2 được phát ở nhịp round_open", () => {
    const narrations: { roundIndex: number; trigger: NarrationTrigger }[] = [];
    const runner = makeRunner((config, trigger) => {
      narrations.push({ roundIndex: config.round_index, trigger });
    });
    const timers = createTimerBag();
    runner.startFirstRound();
    runner.notePromptSettled();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    vi.advanceTimersByTime(ADVANCE_MS);

    expect(runner.getState().currentRoundIndex).toBe(1);
    expect(runner.getState().roundsCompleted).toBe(1);
    expect(runner.isPromptSettled()).toBe(false);
    expect(narrations).toEqual([
      { roundIndex: 0, trigger: "round_open" },
      { roundIndex: 1, trigger: "round_open" },
    ]);
  });

  it("thắng rồi bấm Bỏ qua trong lúc chờ: vòng đã thắng Cấm — NEVER bị ghi skipped, vòng kế Cấm — NEVER bị đóng oan", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    const skipped = skipCurrentRoundIfUnwon(runner, "scaffold_exhausted");
    vi.advanceTimersByTime(ADVANCE_MS);

    expect(skipped).toBe(false);
    expect(runner.getState()).toMatchObject({
      currentRoundIndex: 1,
      roundsCompleted: 1,
      roundsSkipped: 0,
    });
  });

  it("vòng chưa thắng thì Bỏ qua vẫn bỏ qua như cũ", () => {
    const runner = makeRunner();
    runner.startFirstRound();

    const skipped = skipCurrentRoundIfUnwon(runner, "scaffold_exhausted");

    expect(skipped).toBe(true);
    expect(runner.getState()).toMatchObject({
      currentRoundIndex: 1,
      roundsSkipped: 1,
    });
  });

  it("vòng đã đổi trước khi hẹn giờ chạy: hẹn giờ cũ Cấm — NEVER đóng vòng mới", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    runner.completeCurrentRound();
    vi.advanceTimersByTime(ADVANCE_MS);

    expect(runner.getState()).toMatchObject({
      currentRoundIndex: 1,
      roundsCompleted: 1,
    });
  });

  it("clearAll() (rời trang, chơi lại) huỷ mọi hẹn giờ đang chờ", () => {
    const runner = makeRunner();
    const timers = createTimerBag();
    runner.startFirstRound();

    winCurrentRound(runner);
    scheduleWonRoundCompletion(timers, () => runner, ADVANCE_MS);
    timers.clearAll();
    vi.advanceTimersByTime(ADVANCE_MS * 2);

    expect(runner.getState().currentRoundIndex).toBe(0);
  });

  it("bindToRound: callback của vòng cũ bị bỏ qua sau khi vòng đổi hoặc runner bị thay", () => {
    const runner = makeRunner();
    let current: RoundRunner | null = runner;
    runner.startFirstRound();
    const settle = vi.fn();

    const staleAfterAdvance = bindToRound(
      captureRoundToken(runner),
      () => current,
      settle
    );
    runner.completeCurrentRound();
    staleAfterAdvance();
    expect(settle).not.toHaveBeenCalled();

    const staleAfterReplace = bindToRound(
      captureRoundToken(runner),
      () => current,
      settle
    );
    current = makeRunner();
    staleAfterReplace();
    expect(settle).not.toHaveBeenCalled();

    current = runner;
    bindToRound(captureRoundToken(runner), () => current, settle)();
    expect(settle).toHaveBeenCalledTimes(1);
  });
});
