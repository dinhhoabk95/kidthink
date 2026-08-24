import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { GT008Content, GT008Difficulty } from "./template.js";

function extractSlotData(
  data: unknown
): { item_id: string; slot_id: string } | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    "slot_id" in data
  ) {
    const itemId = Reflect.get(data, "item_id");
    const slotId = Reflect.get(data, "slot_id");
    if (typeof itemId === "string" && typeof slotId === "string") {
      return { item_id: itemId, slot_id: slotId };
    }
  }
  return undefined;
}

export class GT008Session extends TemplateGameSession<
  GT008Content,
  GT008Difficulty
> {
  placedSlots: Map<string, string> = new Map(); // slot_id -> item_id

  setupEntities(): void {
    this.placedSlots.clear();
    this.isWon = false;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "place_item" || action.type === "drop_to_slot") {
      const data = extractSlotData(action.data);
      if (!data) {
        return ACTION_RETRY;
      }
      const slot = this.content.slots.find((s) => s.slot_id === data.slot_id);

      if (!slot) {
        return ACTION_RETRY;
      }

      if (slot.expected_item_id === data.item_id) {
        return ACTION_CORRECT;
      }

      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onItemPlaced(itemId: string, slotId: string): void {
    const slot = this.content.slots.find((s) => s.slot_id === slotId);
    if (!slot) {
      return;
    }

    const isCorrect = slot.expected_item_id === itemId;

    this.recordEvent("item_placed", {
      item_id: itemId,
      slot_id: slotId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.placedSlots.set(slotId, itemId);
      if (this.checkWinCondition()) {
        this.winSession();
      }
    }
  }

  override checkWinCondition(): boolean {
    if (this.content.slots.length === 0) {
      return true;
    }

    return this.content.slots.every((s) => {
      const placed = this.placedSlots.get(s.slot_id);
      return placed === s.expected_item_id;
    });
  }
}

export default GT008Session;
