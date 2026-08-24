import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { GT006Content, GT006Difficulty } from "./template.js";

export class GT006Session extends TemplateGameSession<
  GT006Content,
  GT006Difficulty
> {
  private readonly mechanic = new OrderingMechanic();

  setupEntities(): void {
    const steps = this.content.sequence.map((s) => s.step_id);
    if (this.difficulty.shuffle_initial === false) {
      this.mechanic.setInitialSequence(steps);
    } else {
      const rng = deriveStream(this.layoutSeed, "initial");
      this.mechanic.setInitialSequence(shuffle(steps, rng));
    }
    this.isWon = false;
  }

  getCurrentSequence(): readonly string[] {
    return this.mechanic.getCurrentSequence();
  }

  private isInBounds(index: number): boolean {
    return this.mechanic.isInBounds(index);
  }

  reorderSteps(fromIndex: number, toIndex: number): void {
    if (!this.mechanic.reorder(fromIndex, toIndex)) {
      return;
    }
    this.recordEvent("step_reordered", {
      from_index: fromIndex,
      to_index: toIndex,
      current_sequence: this.mechanic.getCurrentSequence(),
    });
  }

  validateAction(action: GameAction): ActionResult {
    const targetSequence = this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);

    return this.mechanic.validate(action, targetSequence);
  }

  onSubmitSequence(): void {
    const { valid } = this.validateAction({
      type: "check_sequence",
      data: {},
    });
    this.recordEvent("sequence_submitted", { is_correct: valid });
    if (valid) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    const targetSequence = this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);

    return this.mechanic.isSequenceCorrect(targetSequence);
  }
}

export default GT006Session;
