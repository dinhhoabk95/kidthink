import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "#src/game-session";

export interface SelectionItem {
  readonly id: string;
  readonly isCorrect: boolean;
}

export type MechanicEventPayload = Record<
  string,
  string | number | boolean | null | undefined | readonly string[]
>;

export type SelectionCompletionRule = "all_matching" | "exact_count";

export interface SelectionValidationRule {
  readonly selectionRule?: SelectionCompletionRule;
  readonly requiredSelectCount?: number;
}

export interface SelectionMechanicOptions extends SelectionValidationRule {
  readonly mode?: "single" | "multi";
  readonly onEvent?: (eventName: string, payload: MechanicEventPayload) => void;
}

/**
 * SelectionMechanic — Primitive for single/multiple choice tap mechanics (BR-TAK-05, BR-TAK-06).
 * Supports both exhaustive `all_matching` and semi-open `exact_count` subset selection (BR-E002-02).
 */
export class SelectionMechanic {
  private readonly mode: "single" | "multi";
  private readonly selectionRule: SelectionCompletionRule;
  private readonly requiredSelectCount?: number;
  private readonly selectedIds: Set<string> = new Set();
  private readonly onEvent?: (
    eventName: string,
    payload: MechanicEventPayload
  ) => void;

  constructor(options?: SelectionMechanicOptions) {
    this.mode = options?.mode ?? "single";
    this.selectionRule = options?.selectionRule ?? "all_matching";
    this.requiredSelectCount = options?.requiredSelectCount;
    this.onEvent = options?.onEvent;
  }

  reset(): void {
    this.selectedIds.clear();
  }

  setSelectedIds(ids: Iterable<string>): void {
    this.selectedIds.clear();
    for (const id of ids) {
      if (!id) {
        continue;
      }
      this.selectedIds.add(id);
      if (this.mode === "single") {
        break;
      }
    }
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

  private matchesSelectionRule(
    items: readonly SelectionItem[],
    override?: SelectionValidationRule,
    requireNonEmptyTargets = false
  ): boolean {
    const correctIds = new Set(
      items.filter((i) => i.isCorrect).map((i) => i.id)
    );
    const rule = override?.selectionRule ?? this.selectionRule;
    if (rule === "exact_count") {
      if (correctIds.size === 0) {
        return false;
      }
      const rawRequired =
        override?.requiredSelectCount ??
        this.requiredSelectCount ??
        correctIds.size;
      const required = Math.max(
        1,
        Math.min(correctIds.size, Math.floor(rawRequired))
      );
      return (
        this.selectedIds.size === required &&
        Array.from(this.selectedIds).every((id) => correctIds.has(id))
      );
    }
    if (requireNonEmptyTargets && correctIds.size === 0) {
      return false;
    }
    return (
      this.selectedIds.size === correctIds.size &&
      Array.from(this.selectedIds).every((id) => correctIds.has(id))
    );
  }

  /**
   * Validate action without mutating state (pure).
   */
  validate(
    action: GameAction,
    items: readonly SelectionItem[],
    override?: SelectionValidationRule
  ): ActionResult {
    if (action.type === "tap_option" || action.type === "select_item") {
      return this.validateTapOption(action, items);
    }
    if (action.type === "submit_selection") {
      return this.matchesSelectionRule(items, override, false)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  isSelectionComplete(
    items: readonly SelectionItem[],
    override?: SelectionValidationRule
  ): boolean {
    return this.matchesSelectionRule(items, override, true);
  }
}
