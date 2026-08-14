import type {
  GT006Content,
  GT006Difficulty,
} from "../../contracts/templates/gt006";
import { BaseGameSession, type FeedbackKind } from "../../game-session";

export class GT006Session extends BaseGameSession {
  readonly content: GT006Content;
  readonly difficulty: GT006Difficulty;
  private currentSequence: string[] = []; // Array of step_ids in current user order
  private isWon = false;

  constructor(content: GT006Content, difficulty: GT006Difficulty) {
    super();
    this.content = content;
    this.difficulty = difficulty;
  }

  setupEntities(): void {
    // Initial order
    this.currentSequence = this.content.sequence.map((s) => s.step_id);
    this.isWon = false;
  }

  reorderSteps(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.currentSequence.length) {
      return;
    }
    if (toIndex < 0 || toIndex >= this.currentSequence.length) {
      return;
    }

    const moved = this.currentSequence[fromIndex];
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

  validateAction(action: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  } {
    if (action.type !== "submit_sequence") {
      return { valid: false, feedback: "none" };
    }
    const targetSequence = [...this.content.sequence]
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);

    const isCorrectSequence =
      this.currentSequence.length === targetSequence.length &&
      this.currentSequence.every(
        (stepId, idx) => stepId === targetSequence[idx]
      );

    if (isCorrectSequence) {
      return { valid: true, feedback: "pop_celebrate" };
    }
    return { valid: false, feedback: "amber_soft" };
  }

  onSubmitSequence(): void {
    const res = this.validateAction({ type: "submit_sequence", data: {} });
    if (res.valid) {
      this.isWon = true;
      this.recordEvent("sequence_submitted", { is_correct: true });
      this.completeSession();
    } else {
      this.recordEvent("sequence_submitted", { is_correct: false });
    }
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}
