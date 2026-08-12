import type {
  GT004Content,
  GT004Difficulty,
} from "../../contracts/templates/gt004";
import { BaseGameSession, type FeedbackKind } from "../../game-session";

export class GT004Session extends BaseGameSession {
  content: GT004Content;
  difficulty: GT004Difficulty;
  private readonly sortedItems: Map<string, string> = new Map(); // item_id -> group_id
  private isWon = false;

  constructor(content: GT004Content, difficulty: GT004Difficulty) {
    super();
    this.content = content;
    this.difficulty = difficulty;
  }

  setupEntities(): void {
    this.sortedItems.clear();
    this.isWon = false;
  }

  validateAction(action: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  } {
    if (action.type !== "sort_item") {
      return { valid: false, feedback: "none" };
    }
    const data = action.data as { item_id: string; group_id: string };
    const item = this.content.items.find((i) => i.item_id === data.item_id);
    if (!item) {
      return { valid: false, feedback: "none" };
    }

    if (item.correct_group_id === data.group_id) {
      return { valid: true, feedback: "pop_celebrate" };
    }
    return { valid: false, feedback: "amber_soft" };
  }

  onItemSorted(itemId: string, groupId: string): void {
    const item = this.content.items.find((i) => i.item_id === itemId);
    if (!item) {
      return;
    }

    if (item.correct_group_id === groupId) {
      this.sortedItems.set(itemId, groupId);
      this.recordEvent("item_sorted", {
        item_id: itemId,
        group_id: groupId,
        is_correct: true,
      });
      if (this.sortedItems.size === this.content.items.length) {
        this.isWon = true;
        this.completeSession();
      }
    } else {
      this.recordEvent("item_sorted", {
        item_id: itemId,
        group_id: groupId,
        is_correct: false,
      });
    }
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}
