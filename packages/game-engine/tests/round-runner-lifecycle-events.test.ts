import { describe, expect, it } from "vitest";
import {
  ACTION_CORRECT,
  type ActionResult,
  BaseGameSession,
} from "#src/game-session";
import { type RoundConfig, RoundRunner } from "#src/round-runner";

const ROUND_COUNT = 3;

/** Session ghi `game_started` ở setup và `game_completed` ở lượt thắng, như GT-031 (qua `winSession` → `completeSession`). */
class LifecycleSession extends BaseGameSession {
  private won = false;

  setupEntities(): void {
    this.recordEvent("game_started");
  }

  validateAction(): ActionResult {
    this.won = true;
    this.recordEvent("game_completed", { score: 100 });
    this.completeSession();
    return ACTION_CORRECT;
  }

  checkWinCondition(): boolean {
    return this.won;
  }
}

/** Session tự ghi `round_started`/`round_completed` (như GT-026): runner vẫn là nguồn duy nhất của hai event này. */
class OwnRoundEventsSession extends LifecycleSession {
  override setupEntities(): void {
    this.recordEvent("round_started", { round_index: 0 });
    super.setupEntities();
  }

  override validateAction(): ActionResult {
    this.recordEvent("round_completed", { round_index: 0 });
    return super.validateAction();
  }
}

function makeRound(index: number): RoundConfig {
  return {
    round_index: index,
    instruction: `Bước ${index + 1}`,
    content_pack: { options: [{ id: `item-${index}` }] },
    difficulty_params: { item_count: 3 },
  };
}

function countByName(runner: RoundRunner, name: string): number {
  return runner.getAllTelemetry().filter((e) => e.event_name === name).length;
}

describe("RoundRunner — event vòng đời không phát đôi", () => {
  it("một vòng: game_completed đúng một lần dù session tự ghi rồi completeSession", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0)],
      sessionFactory: () => new LifecycleSession(),
    });
    runner.startFirstRound();
    runner.handleAction({ type: "tap", data: {} });
    runner.completeCurrentRound();

    expect(countByName(runner, "game_completed")).toBe(1);
  });

  it("engine phát game_started cộng session ghi game_started vẫn chỉ một lần mỗi vòng", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0)],
      sessionFactory: () => new LifecycleSession(),
    });
    runner.startFirstRound();
    runner.recordExternalEvent({
      event_name: "game_started",
      timestamp_ms: Date.now() + 5,
    });

    expect(countByName(runner, "game_started")).toBe(1);
  });

  it("nhiều vòng: mỗi vòng một game_started và một game_completed", () => {
    const runner = new RoundRunner({
      rounds: Array.from({ length: ROUND_COUNT }, (_, i) => makeRound(i)),
      sessionFactory: () => new LifecycleSession(),
    });
    runner.startFirstRound();
    for (let i = 0; i < ROUND_COUNT; i++) {
      runner.handleAction({ type: "tap", data: {} });
      runner.completeCurrentRound();
    }

    expect(countByName(runner, "game_started")).toBe(ROUND_COUNT);
    expect(countByName(runner, "game_completed")).toBe(ROUND_COUNT);
  });

  it("round_started/round_completed do RoundRunner sở hữu: session tự ghi thêm vẫn mỗi vòng một lần", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0), makeRound(1), makeRound(2)],
      sessionFactory: () => new OwnRoundEventsSession(),
    });
    runner.startFirstRound();
    for (let i = 0; i < ROUND_COUNT; i++) {
      runner.handleAction({ type: "tap", data: {} });
      runner.completeCurrentRound();
    }

    expect(countByName(runner, "round_started")).toBe(ROUND_COUNT);
    expect(countByName(runner, "round_completed")).toBe(ROUND_COUNT);
  });
});
