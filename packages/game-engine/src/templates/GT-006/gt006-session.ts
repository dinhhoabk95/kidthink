import type {
  GT006Content,
  GT006Difficulty,
} from "../../contracts/templates/gt006";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session";

export class GT006Session extends TemplateGameSession<
  GT006Content,
  GT006Difficulty
> {
  /** step_ids in the order the child currently has them */
  private currentSequence: string[] = [];

  setupEntities(): void {
    this.currentSequence = this.content.sequence.map((s) => s.step_id);
    this.isWon = false;
  }

  private isInBounds(index: number): boolean {
    return index >= 0 && index < this.currentSequence.length;
  }

  reorderSteps(fromIndex: number, toIndex: number): void {
    if (!(this.isInBounds(fromIndex) && this.isInBounds(toIndex))) {
      return;
    }

    const moved = this.currentSequence[fromIndex];
    if (moved === undefined) {
      return; // unreachable after isInBounds — keeps the checker honest
    }
    const without = [
      ...this.currentSequence.slice(0, fromIndex),
      ...this.currentSequence.slice(fromIndex + 1),
    ];
    this.currentSequence = [
      ...without.slice(0, toIndex),
      moved,
      ...without.slice(toIndex),
    ];
    this.recordEvent("step_reordered", {
      from_index: fromIndex,
      to_index: toIndex,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "submit_sequence") {
      return ACTION_IGNORED;
    }
    const targetSequence = [...this.content.sequence]
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);

    const isCorrectSequence =
      this.currentSequence.length === targetSequence.length &&
      this.currentSequence.every(
        (stepId, idx) => stepId === targetSequence[idx]
      );

    return isCorrectSequence ? ACTION_CORRECT : ACTION_RETRY;
  }

  onSubmitSequence(): void {
    const { valid } = this.validateAction({
      type: "submit_sequence",
      data: {},
    });
    this.recordEvent("sequence_submitted", { is_correct: valid });
    if (valid) {
      this.winSession();
    }
  }
}
