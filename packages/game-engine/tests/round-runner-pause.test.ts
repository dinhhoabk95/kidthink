import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ACTION_RETRY,
  type ActionResult,
  BaseGameSession,
} from "#src/game-session";
import { RoundRunner } from "#src/round-runner";

/** Task #313 B5 — pause dừng hint timer và không tính vào `duration_ms` (BR-HPL-07). */
class IdleSession extends BaseGameSession {
  setupEntities(): void {
    this.recordEvent("setup");
  }
  validateAction(): ActionResult {
    return ACTION_RETRY;
  }
  checkWinCondition(): boolean {
    return false;
  }
}

function makeRunner(): RoundRunner {
  return new RoundRunner({
    rounds: [
      {
        round_index: 0,
        content_pack: {},
        difficulty_params: { item_count: 2, hint_after_ms: 10_000 },
      },
    ],
    sessionFactory: () => new IdleSession(),
  });
}

function eventsOf(runner: RoundRunner, name: string) {
  return runner.getAllTelemetry().filter((e) => e.event_name === name);
}

describe("Task #313 B5 — RoundRunner pause/resume", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("duration_ms trừ thời gian pause", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    vi.advanceTimersByTime(2000);
    runner.pause();
    vi.advanceTimersByTime(30_000);
    runner.resume();
    vi.advanceTimersByTime(1000);
    runner.completeCurrentRound();
    const done = eventsOf(runner, "round_completed")[0];
    expect(done?.data?.duration_ms).toBe(3000);
  });

  it("hint timer không nổ khi đang pause, chạy tiếp phần còn lại sau resume", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    vi.advanceTimersByTime(6000);
    runner.pause();
    vi.advanceTimersByTime(60_000);
    expect(eventsOf(runner, "hint_requested")).toHaveLength(0);
    runner.resume();
    vi.advanceTimersByTime(3900);
    expect(eventsOf(runner, "hint_requested")).toHaveLength(0);
    vi.advanceTimersByTime(200);
    expect(eventsOf(runner, "hint_requested")).toHaveLength(1);
  });

  it("pause/resume lặp không đếm trùng", () => {
    const runner = makeRunner();
    runner.startFirstRound();
    runner.pause();
    runner.pause();
    vi.advanceTimersByTime(5000);
    runner.resume();
    runner.resume();
    vi.advanceTimersByTime(1000);
    runner.completeCurrentRound();
    const done = eventsOf(runner, "round_completed")[0];
    expect(done?.data?.duration_ms).toBe(1000);
  });
});
