import type { AgeBand } from "./contracts/types";

/**
 * Touch floors owned by accessibility.md BR-A11-04, surfaced through the one
 * function BR-ENG-05 requires. Never re-declare these numbers elsewhere.
 */
const MIN_TOUCH_PX = {
  band_3_4: 96,
  primary: 76,
  floor: 64,
} as const;

const DEFAULT_LONG_PRESS_EXIT_MS = 800;

export type PlayVerb =
  | "tap"
  | "drop"
  | "stroke"
  | "adjust"
  | "commit"
  | "revert";

export type SystemBeat = "reveal" | "hint" | "timeout";
export type Beat = SystemBeat;

export type EntityVisual =
  | "idle"
  | "active"
  | "selected"
  | "correct"
  | "incorrect";

export type Gesture =
  | {
      readonly type: "tap";
      readonly x: number;
      readonly y: number;
      readonly timeMs: number;
    }
  | {
      readonly type: "drop";
      readonly fromX: number;
      readonly fromY: number;
      readonly toX: number;
      readonly toY: number;
      readonly timeMs: number;
    }
  | {
      readonly type: "stroke";
      readonly points: readonly { readonly x: number; readonly y: number }[];
      readonly timeMs: number;
    }
  | {
      readonly type: "adjust";
      readonly delta: number;
      readonly timeMs: number;
    }
  | {
      readonly type: "commit";
      readonly timeMs: number;
    }
  | {
      readonly type: "revert";
      readonly timeMs: number;
    };

export interface ViewEntity {
  readonly id: string;
  readonly slotIndex: number;
  readonly role: "source" | "target" | "neutral";
  readonly state: EntityVisual;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface EngineView {
  readonly entities: readonly ViewEntity[];
  readonly activePrompt?: string;
  readonly focusIndex?: number;
}

export interface EngineInput {
  readonly gesture: Gesture;
  readonly targetEntityId?: string;
}

export interface ClientPoint {
  readonly x: number;
  readonly y: number;
}

export interface ElementRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function toLogicPoint(
  client: ClientPoint,
  rect: ElementRect,
  logicWidth = 960,
  logicHeight = 540
): { x: number; y: number } {
  const scaleX = rect.width > 0 ? logicWidth / rect.width : 1;
  const scaleY = rect.height > 0 ? logicHeight / rect.height : 1;
  return {
    x: Math.round((client.x - rect.left) * scaleX),
    y: Math.round((client.y - rect.top) * scaleY),
  };
}

export const LIFECYCLE = {
  tap: {
    toGesture(logicX: number, logicY: number, timeMs: number): Gesture {
      return { type: "tap", x: logicX, y: logicY, timeMs };
    },
  },
} as const;

export interface TouchTarget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  draggable?: boolean;
}

export function getMinTouchTargetSize(
  ageBand: AgeBand,
  isPrimary = false
): number {
  if (ageBand === "3-4") {
    return MIN_TOUCH_PX.band_3_4;
  }
  return isPrimary ? MIN_TOUCH_PX.primary : MIN_TOUCH_PX.floor;
}

export class InteractionManager {
  private selectedSourceId: string | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  getSelectedSourceId(): string | null {
    return this.selectedSourceId;
  }

  selectSource(id: string): void {
    this.selectedSourceId = id;
  }

  clearSelection(): void {
    this.selectedSourceId = null;
  }

  /**
   * Tap-tap drag fallback (BR-ENG-06): first tap arms the source, second tap
   * commits it to the target. Returns null while still awaiting the second tap.
   */
  handleTapTapFallback(
    sourceId: string,
    targetId: string
  ): { source_id: string; target_id: string } | null {
    if (!this.selectedSourceId) {
      this.selectedSourceId = sourceId;
      return null;
    }

    const result = {
      source_id: this.selectedSourceId,
      target_id: targetId,
    };
    this.selectedSourceId = null;
    return result;
  }

  startLongPressExit(
    onExitTriggered: () => void,
    durationMs = DEFAULT_LONG_PRESS_EXIT_MS
  ): void {
    this.cancelLongPressExit();
    this.longPressTimer = setTimeout(onExitTriggered, durationMs);
  }

  cancelLongPressExit(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  validateTouchTargetSize(
    target: TouchTarget,
    ageBand: AgeBand,
    isPrimary = false
  ): boolean {
    const minSize = getMinTouchTargetSize(ageBand, isPrimary);
    return target.width >= minSize && target.height >= minSize;
  }
}
