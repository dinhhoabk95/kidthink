import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_QUIET_OK,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "#src/game-session";

export type MechanicEventPayload = Record<
  string,
  string | number | boolean | null | undefined | readonly string[]
>;

export interface OrderingMechanicOptions {
  readonly onEvent?: (eventName: string, payload: MechanicEventPayload) => void;
}

function readIntegerField(
  data: GameAction["data"],
  key: string
): number | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const val: string | symbol | number | boolean | object | undefined =
    Reflect.get(data, key);
  return typeof val === "number" && Number.isInteger(val) ? val : null;
}

/**
 * OrderingMechanic — Primitive for sequence ordering / step arrangement (GT-006) (BR-TAK-05, BR-TAK-06).
 * Manages in-bounds swaps, reordering, and target sequence validation.
 */
export class OrderingMechanic {
  private currentSequence: string[] = [];
  private readonly onEvent?: (
    eventName: string,
    payload: MechanicEventPayload
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
    return (
      Number.isInteger(index) &&
      index >= 0 &&
      index < this.currentSequence.length
    );
  }

  reorder(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex === toIndex ||
      !(this.isInBounds(fromIndex) && this.isInBounds(toIndex))
    ) {
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
    if (
      indexA === indexB ||
      !(this.isInBounds(indexA) && this.isInBounds(indexB))
    ) {
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
    targetSequence: readonly string[],
    isMatchOverride?: boolean
  ): ActionResult {
    if (action.type === "reorder_step") {
      const fromIndex = readIntegerField(action.data, "from_index");
      const toIndex = readIntegerField(action.data, "to_index");
      if (
        fromIndex === null ||
        toIndex === null ||
        fromIndex === toIndex ||
        !(this.isInBounds(fromIndex) && this.isInBounds(toIndex))
      ) {
        return ACTION_IGNORED;
      }
      // Một bước sắp xếp chưa phải câu trả lời — chỉ nộp mới chấm (`BR-EIC-10`).
      return ACTION_QUIET_OK;
    }

    if (
      action.type === "check_sequence" ||
      action.type === "submit_order" ||
      action.type === "sequence_submitted"
    ) {
      const isMatch = isMatchOverride ?? this.isSequenceCorrect(targetSequence);
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
