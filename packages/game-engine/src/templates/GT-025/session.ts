import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import type { GT025Content, GT025Difficulty } from "./template.js";

export class GT025Session extends TemplateGameSession<
  GT025Content,
  GT025Difficulty
> {
  private readonly foundDifferenceIds = new Set<string>();

  setupEntities(): void {
    this.isWon = false;
    this.foundDifferenceIds.clear();

    this.recordEvent("round_started", {
      round_index: 0,
      total_differences: this.content.differences.length,
    });
  }

  private validateTapObject(data: unknown): ActionResult {
    const objectId =
      typeof data === "object" && data !== null
        ? (Reflect.get(data, "object_id") ?? Reflect.get(data, "item_id"))
        : undefined;

    if (typeof objectId !== "string") {
      return ACTION_IGNORED;
    }

    // Find if objectId matches any difference pair (left or right)
    const diff = this.content.differences.find(
      (d) => d.left_id === objectId || d.right_id === objectId
    );

    if (!diff) {
      this.recordEvent("item_selected", {
        object_id: objectId,
        is_correct: false,
      });
      return ACTION_RETRY;
    }

    if (this.foundDifferenceIds.has(diff.id)) {
      return ACTION_IGNORED; // Already found
    }

    this.foundDifferenceIds.add(diff.id);
    this.recordEvent("item_selected", {
      object_id: objectId,
      is_correct: true,
      difference_id: diff.id,
      found_count: this.foundDifferenceIds.size,
      total_differences: this.content.differences.length,
    });

    if (this.foundDifferenceIds.size >= this.content.differences.length) {
      this.isWon = true;
      this.recordEvent("round_completed", { round_index: 0 });
      this.completeSession();
    }

    return ACTION_CORRECT;
  }

  validateAction(action: GameAction): ActionResult {
    switch (action.type) {
      case "tap_object":
      case "select_item":
        return this.validateTapObject(action.data);
      default:
        return ACTION_IGNORED;
    }
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  getFoundCount(): number {
    return this.foundDifferenceIds.size;
  }

  override destroy(): void {
    this.foundDifferenceIds.clear();
  }
}
