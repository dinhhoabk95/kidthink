import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "../game-session.js";

export interface PairDefinition {
  readonly leftId: string;
  readonly rightId: string;
}

export interface PairingMechanicOptions {
  readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;
}

/**
 * PairingMechanic — Primitive for bipartite matching (GT-005) (BR-TAK-05, BR-TAK-06).
 * Handles matching pairs between two entity sets.
 */
export class PairingMechanic {
  /** Matched leftId -> rightId */
  private readonly matchedPairs: Map<string, string> = new Map();
  /** Staged left entity awaiting right match */
  private stagedLeftId: string | null = null;
  private readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;

  constructor(options?: PairingMechanicOptions) {
    this.onEvent = options?.onEvent;
  }

  reset(): void {
    this.matchedPairs.clear();
    this.stagedLeftId = null;
  }

  getMatchedPairs(): ReadonlyMap<string, string> {
    return this.matchedPairs;
  }

  isLeftMatched(leftId: string): boolean {
    return this.matchedPairs.has(leftId);
  }

  isRightMatched(rightId: string): boolean {
    for (const right of this.matchedPairs.values()) {
      if (right === rightId) {
        return true;
      }
    }
    return false;
  }

  getStagedLeftId(): string | null {
    return this.stagedLeftId;
  }

  stageLeft(leftId: string | null): void {
    this.stagedLeftId = leftId;
  }

  match(leftId: string, rightId: string): void {
    this.matchedPairs.set(leftId, rightId);
    if (this.stagedLeftId === leftId) {
      this.stagedLeftId = null;
    }
  }

  countMatched(): number {
    return this.matchedPairs.size;
  }

  /**
   * Pure action validation.
   */
  validate(
    action: GameAction,
    validPairs: readonly PairDefinition[]
  ): ActionResult {
    if (action.type !== "match_pair") {
      return ACTION_IGNORED;
    }

    const data = action.data as
      | { left_item_id?: string; right_item_id?: string }
      | undefined;
    const leftId = data?.left_item_id;
    const rightId = data?.right_item_id;

    if (!(leftId && rightId)) {
      return ACTION_IGNORED;
    }

    const isValidPair = validPairs.some(
      (p) => p.leftId === leftId && p.rightId === rightId
    );

    return isValidPair ? ACTION_CORRECT : ACTION_RETRY;
  }

  isPairingComplete(validPairs: readonly PairDefinition[]): boolean {
    if (validPairs.length === 0) {
      return false;
    }
    return (
      this.matchedPairs.size === validPairs.length &&
      validPairs.every((p) => this.matchedPairs.get(p.leftId) === p.rightId)
    );
  }
}
