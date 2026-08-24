import { describe, expect, it, vi } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_RETRY,
  type ActionResult,
  BaseGameSession,
  type GameAction,
} from "#src/game-session";
import { type RoundConfig, RoundRunner } from "#src/round-runner";

class MockSession extends BaseGameSession {
  private won = false;
  private destroyed = false;

  setupEntities(): void {
    this.recordEvent("setup");
  }

  validateAction(a: GameAction): ActionResult {
    if (a.type === "correct") {
      this.won = true;
      this.recordEvent("answer_correct");
      return ACTION_CORRECT;
    }
    this.recordEvent("answer_incorrect");
    return ACTION_RETRY;
  }

  checkWinCondition(): boolean {
    return this.won;
  }

  override destroy(): void {
    this.destroyed = true;
    super.destroy();
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }
}

function makeRound(index: number): RoundConfig {
  return {
    round_index: index,
    instruction: `Bé làm bước ${index + 1}`,
    content_pack: { options: [{ id: `item-${index}` }] },
    difficulty_params: { item_count: 3 + index },
  };
}

function mockFactory(): MockSession {
  return new MockSession();
}

describe("RoundRunner (BR-RSP)", () => {
  it("headless 4-round set completes in order", () => {
    const rounds = [makeRound(0), makeRound(1), makeRound(2), makeRound(3)];
    const completedRounds: number[] = [];

    const runner = new RoundRunner({
      rounds,
      sessionFactory: mockFactory,
      onRoundCompleted: (idx) => completedRounds.push(idx),
    });

    runner.startFirstRound();

    for (let i = 0; i < 4; i++) {
      expect(runner.getState().currentRoundIndex).toBe(i);
      expect(runner.getCurrentSession()).not.toBeNull();

      runner.handleAction({ type: "correct", data: {} });
      expect(runner.isCurrentRoundWon()).toBe(true);

      const hasMore = runner.completeCurrentRound();
      if (i < 3) {
        expect(hasMore).toBe(true);
      } else {
        expect(hasMore).toBe(false);
      }
    }

    expect(runner.getState().isFinished).toBe(true);
    expect(runner.getState().roundsCorrect).toBe(4);
    expect(runner.getState().roundsSkipped).toBe(0);
    expect(completedRounds).toEqual([0, 1, 2, 3]);
  });

  it("BR-RSP-02: single-round set emits round_started", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0)],
      sessionFactory: mockFactory,
    });

    runner.startFirstRound();

    const events = runner.getAllTelemetry();
    const roundStarted = events.filter((e) => e.event_name === "round_started");
    expect(roundStarted).toHaveLength(1);
    expect(roundStarted[0].data).toEqual(
      expect.objectContaining({ round_index: 0 })
    );
  });

  it("BR-RSP-02: multi-round set emits round_started for each round", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0), makeRound(1), makeRound(2)],
      sessionFactory: mockFactory,
    });

    runner.startFirstRound();

    // Complete round 0
    runner.handleAction({ type: "correct", data: {} });
    runner.completeCurrentRound();

    // Complete round 1
    runner.handleAction({ type: "correct", data: {} });
    runner.completeCurrentRound();

    const events = runner.getAllTelemetry();
    const roundStarted = events.filter((e) => e.event_name === "round_started");
    expect(roundStarted).toHaveLength(3);
    expect(roundStarted.map((e) => e.data?.round_index)).toEqual([0, 1, 2]);
  });

  it("BR-RSP-03: destroy() called on previous session before next starts", () => {
    const sessions: MockSession[] = [];
    const factory = () => {
      const s = new MockSession();
      sessions.push(s);
      return s;
    };

    const runner = new RoundRunner({
      rounds: [makeRound(0), makeRound(1)],
      sessionFactory: factory,
    });

    runner.startFirstRound();
    expect(sessions).toHaveLength(1);

    runner.handleAction({ type: "correct", data: {} });
    runner.completeCurrentRound();

    // First session must be destroyed before second starts
    expect(sessions[0].isDestroyed()).toBe(true);
    expect(sessions).toHaveLength(2);
    expect(sessions[1].isDestroyed()).toBe(false);

    runner.destroy();
  });

  it("scaffold exhaustion skips round and advances", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0), makeRound(1), makeRound(2)],
      sessionFactory: mockFactory,
    });

    runner.startFirstRound();

    // Skip round 0
    const hasMore = runner.skipCurrentRound("scaffold_exhausted");
    expect(hasMore).toBe(true);
    expect(runner.getState().currentRoundIndex).toBe(1);
    expect(runner.getState().roundsSkipped).toBe(1);

    // Check round_skipped event
    const events = runner.getAllTelemetry();
    const skipped = events.filter((e) => e.event_name === "round_skipped");
    expect(skipped).toHaveLength(1);
    expect(skipped[0].data).toEqual(
      expect.objectContaining({
        round_index: 0,
        reason: "scaffold_exhausted",
      })
    );

    runner.destroy();
  });

  it("hint count accumulates across rounds (not reset per round)", () => {
    const runner = new RoundRunner({
      rounds: [makeRound(0), makeRound(1)],
      sessionFactory: mockFactory,
    });

    runner.startFirstRound();
    runner.recordHint();
    runner.recordHint();
    expect(runner.getState().hintCountTotal).toBe(2);

    runner.handleAction({ type: "correct", data: {} });
    runner.completeCurrentRound();

    // Hints should still be 2 after round advance
    runner.recordHint();
    expect(runner.getState().hintCountTotal).toBe(3);

    runner.destroy();
  });

  it("rejects empty rounds array", () => {
    expect(() => {
      new RoundRunner({
        rounds: [],
        sessionFactory: mockFactory,
      });
    }).toThrow("RoundRunner requires at least one round");
  });

  it("onAllRoundsCompleted callback fires after last round", () => {
    const allComplete = vi.fn();
    const runner = new RoundRunner({
      rounds: [makeRound(0)],
      sessionFactory: mockFactory,
      onAllRoundsCompleted: allComplete,
    });

    runner.startFirstRound();
    runner.handleAction({ type: "correct", data: {} });
    runner.completeCurrentRound();

    expect(allComplete).toHaveBeenCalledOnce();
  });

  it("destroy cleans up current session", () => {
    const sessions: MockSession[] = [];
    const factory = () => {
      const s = new MockSession();
      sessions.push(s);
      return s;
    };

    const runner = new RoundRunner({
      rounds: [makeRound(0), makeRound(1)],
      sessionFactory: factory,
    });

    runner.startFirstRound();
    runner.destroy();

    expect(sessions[0].isDestroyed()).toBe(true);
    expect(runner.getState().isFinished).toBe(true);
  });
});
