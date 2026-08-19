import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
} from "../game-session.js";

export interface PlacementItem {
  readonly id: string;
  readonly targetId: string;
  readonly isCorrect?: boolean;
}

export interface PlacementMechanicOptions {
  readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;
}

/**
 * PlacementMechanic — Primitive for drag-and-drop and tap-tap placement (BR-TAK-05, BR-TAK-06).
 * Handles container/bucket placement and mandatory tap-tap fallback (BR-GTC-06).
 */
export class PlacementMechanic {
  /** Map of placed item_id -> container_id */
  private readonly placements: Map<string, string> = new Map();
  /** Staged item for tap-tap fallback */
  private stagedItemId: string | null = null;
  private readonly onEvent?: (
    eventName: string,
    payload: Record<string, unknown>
  ) => void;

  constructor(options?: PlacementMechanicOptions) {
    this.onEvent = options?.onEvent;
  }

  reset(): void {
    this.placements.clear();
    this.stagedItemId = null;
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.placements;
  }

  getPlacedContainer(itemId: string): string | undefined {
    return this.placements.get(itemId);
  }

  getStagedItemId(): string | null {
    return this.stagedItemId;
  }

  stageItem(itemId: string | null): void {
    this.stagedItemId = itemId;
  }

  place(itemId: string, targetId: string): void {
    this.placements.set(itemId, targetId);
    if (this.stagedItemId === itemId) {
      this.stagedItemId = null;
    }
  }

  remove(itemId: string): void {
    this.placements.delete(itemId);
    if (this.stagedItemId === itemId) {
      this.stagedItemId = null;
    }
  }

  countPlaced(): number {
    return this.placements.size;
  }

  /**
   * Pure action validation.
   */
  validate(
    action: GameAction,
    items: readonly PlacementItem[],
    targetIdResolver?: (targetId: string) => boolean
  ): ActionResult {
    if (
      action.type !== "drop_item" &&
      action.type !== "tap_tap_item" &&
      action.type !== "sort_item" &&
      action.type !== "place_item"
    ) {
      return ACTION_IGNORED;
    }

    const data = action.data as
      | {
          item_id?: string;
          container_id?: string;
          group_id?: string;
          target_id?: string;
        }
      | undefined;
    const itemId = data?.item_id;
    const targetId = data?.target_id || data?.container_id || data?.group_id;

    if (!(itemId && targetId)) {
      return ACTION_IGNORED;
    }

    if (targetIdResolver && !targetIdResolver(targetId)) {
      return ACTION_IGNORED;
    }

    const item = items.find((i) => i.id === itemId);
    if (!item) {
      return ACTION_IGNORED;
    }

    // Check if target matches item's targetId or is marked correct
    const isTargetMatch = item.targetId === targetId;
    const isExplicitCorrect =
      item.isCorrect === undefined ? true : item.isCorrect;

    return isTargetMatch && isExplicitCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  /**
   * Check if all required target items have been correctly placed.
   */
  isPlacementComplete(items: readonly PlacementItem[]): boolean {
    const requiredItems = items.filter((i) => i.isCorrect !== false);
    if (requiredItems.length === 0) {
      return false;
    }

    return requiredItems.every((item) => {
      const placedTarget = this.placements.get(item.id);
      return placedTarget === item.targetId;
    });
  }
}
