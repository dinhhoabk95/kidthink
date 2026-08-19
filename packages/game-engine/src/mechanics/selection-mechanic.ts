import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "../game-session.js";

export interface SelectionItem {
  readonly id: string;
  readonly isCorrect: boolean;
}

export interface SelectionMechanicOptions {
  readonly mode?: "single" | "multi";
  readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;
}

/**
 * SelectionMechanic — Primitive for single/multiple choice tap mechanics (BR-TAK-05, BR-TAK-06).
 * Agnostic of educational domain, works on abstract SelectionItem ids.
 */
export class SelectionMechanic {
  private readonly mode: "single" | "multi";
  private readonly selectedIds: Set<string> = new Set();
  private readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;

  constructor(options?: SelectionMechanicOptions) {
    this.mode = options?.mode ?? "single";
    this.onEvent = options?.onEvent;
  }

  reset(): void {
    this.selectedIds.clear();
  }

  getSelectedIds(): readonly string[] {
    return Array.from(this.selectedIds);
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  select(id: string): void {
    if (this.mode === "single") {
      this.selectedIds.clear();
      this.selectedIds.add(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  toggle(id: string): void {
    if (this.mode === "single") {
      if (this.selectedIds.has(id)) {
        this.selectedIds.clear();
      } else {
        this.selectedIds.clear();
        this.selectedIds.add(id);
      }
    } else if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  private validateTapOption(
    action: GameAction,
    items: readonly SelectionItem[]
  ): ActionResult {
    const data = action.data;
    const itemId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "item_id")
        : undefined;
    if (typeof itemId !== "string" || itemId.length === 0) {
      return ACTION_IGNORED;
    }
    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return ACTION_IGNORED;
    }
    return item.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  private validateSubmit(items: readonly SelectionItem[]): ActionResult {
    const correctIds = new Set(
      items.filter((i) => i.isCorrect).map((i) => i.id)
    );
    const isExactMatch =
      this.selectedIds.size === correctIds.size &&
      Array.from(this.selectedIds).every((id) => correctIds.has(id));
    return isExactMatch ? ACTION_CORRECT : ACTION_RETRY;
  }

  /**
   * Validate action without mutating state (pure).
   */
  validate(action: GameAction, items: readonly SelectionItem[]): ActionResult {
    if (action.type === "tap_option" || action.type === "select_item") {
      return this.validateTapOption(action, items);
    }
    if (action.type === "submit_selection") {
      return this.validateSubmit(items);
    }
    return ACTION_IGNORED;
  }

  isSelectionComplete(items: readonly SelectionItem[]): boolean {
    const correctIds = new Set(
      items.filter((i) => i.isCorrect).map((i) => i.id)
    );
    if (correctIds.size === 0) {
      return false;
    }
    return (
      this.selectedIds.size === correctIds.size &&
      Array.from(this.selectedIds).every((id) => correctIds.has(id))
    );
  }
}
