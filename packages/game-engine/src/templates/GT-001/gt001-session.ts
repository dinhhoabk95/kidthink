import type {
  GT001Content,
  GT001Difficulty,
} from "../../contracts/templates/gt001";
import { BaseGameSession, type FeedbackKind } from "../../game-session";

export class GT001Session extends BaseGameSession {
  content: GT001Content;
  difficulty: GT001Difficulty;
  selectedItemId: string | null = null;
  private isWon = false;

  constructor(content: GT001Content, difficulty: GT001Difficulty) {
    super();
    this.content = content;
    this.difficulty = difficulty;
  }

  setupEntities(): void {
    this.selectedItemId = null;
    this.isWon = false;
  }

  validateAction(action: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  } {
    if (action.type !== "tap_option") {
      return { valid: false, feedback: "none" };
    }
    const data = action.data as { item_id: string };
    const option = this.content.options.find(
      (opt) => opt.item_id === data.item_id
    );
    if (!option) {
      return { valid: false, feedback: "none" };
    }

    if (option.is_correct) {
      return { valid: true, feedback: "pop_celebrate" };
    }
    return { valid: false, feedback: "amber_soft" };
  }

  onItemLocked(itemId: string): void {
    this.selectedItemId = itemId;
    const option = this.content.options.find((opt) => opt.item_id === itemId);
    if (option?.is_correct) {
      this.isWon = true;
      this.recordEvent("item_selected", { item_id: itemId, is_correct: true });
      this.completeSession();
    } else {
      this.recordEvent("item_selected", { item_id: itemId, is_correct: false });
    }
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}
