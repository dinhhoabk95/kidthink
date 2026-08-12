import type {
  GT002Content,
  GT002Difficulty,
} from "../../contracts/templates/gt002";
import { BaseGameSession, type FeedbackKind } from "../../game-session";

export class GT002Session extends BaseGameSession {
  content: GT002Content;
  difficulty: GT002Difficulty;
  private readonly selectedItemIds: Set<string> = new Set();
  private isWon = false;

  constructor(content: GT002Content, difficulty: GT002Difficulty) {
    super();
    this.content = content;
    this.difficulty = difficulty;
  }

  setupEntities(): void {
    this.selectedItemIds.clear();
    this.isWon = false;
  }

  toggleItemSelection(itemId: string): void {
    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
    } else {
      this.selectedItemIds.add(itemId);
    }
  }

  validateAction(action: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  } {
    if (action.type !== "submit_selection") {
      return { valid: false, feedback: "none" };
    }
    const correctTargetIds = new Set(
      this.content.items.filter((i) => i.is_correct).map((i) => i.item_id)
    );

    const isExactMatch =
      this.selectedItemIds.size === correctTargetIds.size &&
      [...this.selectedItemIds].every((id) => correctTargetIds.has(id));

    if (isExactMatch) {
      return { valid: true, feedback: "pop_celebrate" };
    }
    return { valid: false, feedback: "amber_soft" };
  }

  onSubmitSelection(): void {
    const res = this.validateAction({ type: "submit_selection", data: {} });
    if (res.valid) {
      this.isWon = true;
      this.recordEvent("selection_submitted", { is_correct: true });
      this.completeSession();
    } else {
      this.recordEvent("selection_submitted", { is_correct: false });
    }
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}
