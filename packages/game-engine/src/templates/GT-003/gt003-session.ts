import type {
  GT003Content,
  GT003Difficulty,
} from "../../contracts/templates/gt003";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session";

const DROP_ACTIONS = new Set(["drop_item", "tap_tap_item"]);

export class GT003Session extends TemplateGameSession<
  GT003Content,
  GT003Difficulty
> {
  private readonly itemsInContainer: Set<string> = new Set();

  setupEntities(): void {
    this.itemsInContainer.clear();
    this.isWon = false;
  }

  /** The item, only when it was dropped on this level's one container. */
  private resolveDrop(itemId: string, containerId: string) {
    if (containerId !== this.content.container.container_id) {
      return;
    }
    return this.content.items.find((i) => i.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    if (!DROP_ACTIONS.has(action.type)) {
      return ACTION_IGNORED;
    }
    const { item_id, container_id } = action.data as {
      item_id: string;
      container_id: string;
    };
    const item = this.resolveDrop(item_id, container_id);
    if (!item) {
      return ACTION_IGNORED;
    }
    return item.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  onItemDropped(itemId: string, containerId: string): void {
    const item = this.resolveDrop(itemId, containerId);
    if (!item) {
      return;
    }

    this.recordEvent("item_dropped", {
      item_id: itemId,
      is_correct: item.is_correct,
    });
    if (!item.is_correct) {
      return;
    }

    this.itemsInContainer.add(itemId);
    const targetCount = this.content.items.filter((i) => i.is_correct).length;
    if (this.itemsInContainer.size === targetCount) {
      this.winSession();
    }
  }
}
