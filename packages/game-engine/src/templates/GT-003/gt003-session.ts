import type {
  GT003Content,
  GT003Difficulty,
} from "../../contracts/templates/gt003";
import { BaseGameSession, type FeedbackKind } from "../../game-session";

export class GT003Session extends BaseGameSession {
  content: GT003Content;
  difficulty: GT003Difficulty;
  private readonly itemsInContainer: Set<string> = new Set();
  private isWon = false;

  constructor(content: GT003Content, difficulty: GT003Difficulty) {
    super();
    this.content = content;
    this.difficulty = difficulty;
  }

  setupEntities(): void {
    this.itemsInContainer.clear();
    this.isWon = false;
  }

  validateAction(action: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  } {
    if (action.type !== "drop_item" && action.type !== "tap_tap_item") {
      return { valid: false, feedback: "none" };
    }
    const data = action.data as { item_id: string; container_id: string };
    const item = this.content.items.find((i) => i.item_id === data.item_id);
    if (!item || data.container_id !== this.content.container.container_id) {
      return { valid: false, feedback: "none" };
    }

    if (item.is_correct) {
      return { valid: true, feedback: "pop_celebrate" };
    }
    return { valid: false, feedback: "amber_soft" };
  }

  onItemDropped(itemId: string, containerId: string): void {
    const item = this.content.items.find((i) => i.item_id === itemId);
    if (!item || containerId !== this.content.container.container_id) {
      return;
    }

    if (item.is_correct) {
      this.itemsInContainer.add(itemId);
      this.recordEvent("item_dropped", { item_id: itemId, is_correct: true });
      const targetItems = this.content.items.filter((i) => i.is_correct);
      if (this.itemsInContainer.size === targetItems.length) {
        this.isWon = true;
        this.completeSession();
      }
    } else {
      this.recordEvent("item_dropped", { item_id: itemId, is_correct: false });
    }
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}
