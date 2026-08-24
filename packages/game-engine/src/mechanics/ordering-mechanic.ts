import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "#src/game-session";

export interface OrderingMechanicOptions {
  readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;
}

/**
 * OrderingMechanic — Primitive for sequence ordering / step arrangement (GT-006) (BR-TAK-05, BR-TAK-06).
 * Manages in-bounds swaps, reordering, and target sequence validation.
 */
export class OrderingMechanic {
  private currentSequence: string[] = [];
  private readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;

  constructor(options?: OrderingMechanicOptions) {
    this.onEvent = options?.onEvent;
  }

  setInitialSequence(sequence: readonly string[]): void {
    this.currentSequence = [...sequence];
  }

  getCurrentSequence(): readonly string[] {
    return this.currentSequence;
  }

  isInBounds(index: number): boolean {
    return index >= 0 && index < this.currentSequence.length;
  }

  reorder(fromIndex: number, toIndex: number): boolean {
    if (!(this.isInBounds(fromIndex) && this.isInBounds(toIndex))) {
      return false;
    }
    const moved = this.currentSequence[fromIndex];
    if (moved === undefined) {
      return false;
    }
    const without = [
      ...this.currentSequence.slice(0, fromIndex),
      ...this.currentSequence.slice(fromIndex + 1),
    ];
    this.currentSequence = [
      ...without.slice(0, toIndex),
      moved,
      ...without.slice(toIndex),
    ];
    return true;
  }

  swap(indexA: number, indexB: number): boolean {
    if (!(this.isInBounds(indexA) && this.isInBounds(indexB))) {
      return false;
    }
    const itemA = this.currentSequence[indexA];
    const itemB = this.currentSequence[indexB];
    if (itemA === undefined || itemB === undefined) {
      return false;
    }
    this.currentSequence[indexA] = itemB;
    this.currentSequence[indexB] = itemA;
    return true;
  }

  /**
   * Pure action validation.
   */
  validate(
    action: GameAction,
    targetSequence: readonly string[]
  ): ActionResult {
    if (action.type === "reorder_step") {
      const data = action.data as
        | { from_index?: number; to_index?: number }
        | undefined;
      const fromIndex = data?.from_index;
      const toIndex = data?.to_index;
      if (fromIndex === undefined || toIndex === undefined) {
        return ACTION_IGNORED;
      }
      return this.isInBounds(fromIndex) && this.isInBounds(toIndex)
        ? ACTION_CORRECT
        : ACTION_IGNORED;
    }

    if (action.type === "check_sequence" || action.type === "submit_order") {
      const isMatch =
        this.currentSequence.length === targetSequence.length &&
        this.currentSequence.every((id, idx) => id === targetSequence[idx]);
      return isMatch ? ACTION_CORRECT : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  isSequenceCorrect(targetSequence: readonly string[]): boolean {
    return (
      this.currentSequence.length === targetSequence.length &&
      this.currentSequence.every((id, idx) => id === targetSequence[idx])
    );
  }
}
