import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { SelectionMechanic } from "../../mechanics/selection-mechanic.js";
import type { GT002Content, GT002Difficulty } from "./template.js";

type TargetItem = GT002Content["items"][number];

export class GT002Session extends TemplateGameSession<
  GT002Content,
  GT002Difficulty
> {
  displayItems: readonly TargetItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "multi" });

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.displayItems = [...this.content.items];
  }

  toggleItemSelection(itemId: string): void {
    this.mechanic.toggle(itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(action, items);
  }

  onSubmitSelection(): void {
    const { valid } = this.validateAction({
      type: "submit_selection",
      data: {},
    });
    this.recordEvent("selection_submitted", { is_correct: valid });
    if (valid) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.isSelectionComplete(items);
  }
}

export default GT002Session;
