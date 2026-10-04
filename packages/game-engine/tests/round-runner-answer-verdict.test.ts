import { describe, expect, it } from "vitest";
import {
  ACTION_CORRECT,
  ACTION_RETRY,
  type ActionResult,
  BaseGameSession,
} from "#src/game-session";
import { type RoundConfig, RoundRunner } from "#src/round-runner";

/** Session không tự phát `answer_*` — như 36 engine trên bề mặt chơi. */
class SilentSession extends BaseGameSession {
  setupEntities(): void {
    this.recordEvent("setup");
  }

  validateAction(): ActionResult {
    return ACTION_CORRECT;
  }

  checkWinCondition(): boolean {
    return true;
  }
}

/** Session tự phát `answer_*` như GT-000. */
class SelfReportingSession extends SilentSession {
  override validateAction(): ActionResult {
    this.recordEvent("answer_correct", { attempt_index: 1 });
    return ACTION_CORRECT;
  }
}

/** Engine nhiều lượt trong một vòng như GT-026/027 (BR-SCO-09). */
class TrialSession extends SilentSession {
  override isTrialBased(): boolean {
    return true;
  }
}

function roundOf(index: number): RoundConfig {
  return {
    round_index: index,
    instruction: "x",
    content_pack: { options: [] },
    difficulty_params: { item_count: 3 },
  };
}

function names(runner: RoundRunner): string[] {
  return runner.getAllTelemetry().map((e) => e.event_name);
}

describe("RoundRunner.recordAnswerVerdict (BR-SCO-01, BR-RSP-12)", () => {
  it("phát answer_incorrect rồi answer_correct với attempt_index tăng dần", () => {
    const runner = new RoundRunner({
      rounds: [roundOf(0)],
      sessionFactory: () => new SilentSession(),
    });
    runner.startFirstRound();

    runner.recordAnswerVerdict(ACTION_RETRY.valid);
    runner.recordAnswerVerdict(ACTION_CORRECT.valid);

    const answers = runner
      .getAllTelemetry()
      .filter((e) => e.event_name.startsWith("answer_"));
    expect(answers.map((e) => e.event_name)).toEqual([
      "answer_incorrect",
      "answer_correct",
    ]);
    expect(answers.map((e) => e.data?.attempt_index)).toEqual([1, 2]);
    expect(answers.every((e) => e.data?.round_index === 0)).toBe(true);
  });

  it("đặt lại attempt_index ở vòng kế", () => {
    const runner = new RoundRunner({
      rounds: [roundOf(0), roundOf(1)],
      sessionFactory: () => new SilentSession(),
    });
    runner.startFirstRound();
    runner.recordAnswerVerdict(true);
    runner.completeCurrentRound();
    runner.recordAnswerVerdict(true);

    const second = runner
      .getAllTelemetry()
      .filter((e) => e.event_name === "answer_correct")
      .map((e) => e.data?.attempt_index);
    expect(second).toEqual([1, 1]);
  });

  it("không phát trùng khi session đã tự phát answer_*", () => {
    const runner = new RoundRunner({
      rounds: [roundOf(0)],
      sessionFactory: () => new SelfReportingSession(),
    });
    runner.startFirstRound();

    runner.handleAction({ type: "any", data: {} });
    runner.recordAnswerVerdict(true);

    expect(names(runner).filter((n) => n === "answer_correct")).toHaveLength(1);
  });

  it("không phát gì khi chưa có vòng", () => {
    const runner = new RoundRunner({
      rounds: [roundOf(0)],
      sessionFactory: () => new SilentSession(),
    });
    runner.recordAnswerVerdict(true);
    expect(names(runner)).toEqual([]);
  });

  it("đánh dấu trial_based trên answer_* của engine nhiều lượt (BR-SCO-09)", () => {
    const runner = new RoundRunner({
      rounds: [roundOf(0)],
      sessionFactory: () => new TrialSession(),
    });
    runner.startFirstRound();

    runner.recordAnswerVerdict(true);
    runner.recordAnswerVerdict(false);

    const answers = runner
      .getAllTelemetry()
      .filter((e) => e.event_name.startsWith("answer_"));
    expect(answers.map((e) => e.data?.trial_based)).toEqual([true, true]);
  });

  it("engine một đáp án không mang trial_based", () => {
    const runner = new RoundRunner({
      rounds: [roundOf(0)],
      sessionFactory: () => new SilentSession(),
    });
    runner.startFirstRound();

    runner.recordAnswerVerdict(true);

    const answer = runner
      .getAllTelemetry()
      .find((e) => e.event_name === "answer_correct");
    expect(answer?.data?.trial_based).toBeUndefined();
  });
});
