import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import {
  InhibitionSystem,
  type TrialItem,
} from "#src/systems/inhibition-system";
import type { GT026Content, GT026Difficulty } from "./template.js";

export class GT026Session extends TemplateGameSession<
  GT026Content,
  GT026Difficulty
> {
  private inhibitionSystem!: InhibitionSystem;

  setupEntities(): void {
    this.isWon = false;

    const trials: TrialItem[] = this.content.trials.map((t) => ({
      id: t.id,
      kind: t.kind,
    }));

    this.inhibitionSystem = new InhibitionSystem({
      trials,
      stimulusWindowMs: this.difficulty.stimulus_window_ms,
      isiMs: this.difficulty.isi_ms,
    });

    this.recordEvent("round_started", {
      round_index: 0,
      total_trials: trials.length,
    });
  }

  getCurrentTrial() {
    return this.inhibitionSystem?.getCurrentTrial() ?? null;
  }

  getState() {
    return this.inhibitionSystem?.getState() ?? "finished";
  }

  validateAction(action: GameAction): ActionResult {
    switch (action.type) {
      case "tap_stimulus":
      case "tap_card":
      case "select_item": {
        const result = this.inhibitionSystem.handleAction();
        if (!result) {
          return ACTION_IGNORED;
        }

        this.recordEvent("item_selected", {
          outcome: result.outcome,
          is_correct: result.isCorrect,
          action_type: "tap",
        });

        if (this.inhibitionSystem.isFinished()) {
          this.isWon =
            this.inhibitionSystem.getCorrectCount() >=
            Math.ceil(this.content.trials.length * 0.6);
          this.recordEvent("round_completed", { round_index: 0 });
          this.completeSession();
        }

        return result.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
      }
      default:
        return ACTION_IGNORED;
    }
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return null;
    }

    const verdict = this.inhibitionSystem.tick(deltaMs);

    if (this.inhibitionSystem.isFinished() && !this.isWon) {
      this.isWon =
        this.inhibitionSystem.getCorrectCount() >=
        Math.ceil(this.content.trials.length * 0.6);
      this.recordEvent("round_completed", { round_index: 0 });
      this.completeSession();
    }

    if (verdict) {
      this.recordEvent("item_selected", {
        outcome: verdict.outcome,
        is_correct: verdict.isCorrect,
        action_type: "timeout_no_tap",
      });

      // Phát phản hồi cho phán quyết không-hành-động (BR-TGB-04, BR-TGB-05)
      return verdict.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
    }

    return null;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override destroy(): void {
    // cleanup
  }
}
