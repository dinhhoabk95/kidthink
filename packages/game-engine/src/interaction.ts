export interface TouchTarget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  draggable?: boolean;
}

export function getMinTouchTargetSize(
  ageBand: "3-4" | "4-5" | "5-6",
  isPrimary = false
): number {
  if (ageBand === "3-4") {
    return 96;
  }
  if (isPrimary) {
    return 76;
  }
  return 64;
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

  startLongPressExit(onExitTriggered: () => void, durationMs = 800): void {
    this.cancelLongPressExit();
    this.longPressTimer = setTimeout(() => {
      onExitTriggered();
    }, durationMs);
  }

  cancelLongPressExit(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  validateTouchTargetSize(
    target: TouchTarget,
    ageBand: "3-4" | "4-5" | "5-6",
    isPrimary = false
  ): boolean {
    const minSize = getMinTouchTargetSize(ageBand, isPrimary);
    return target.width >= minSize && target.height >= minSize;
  }
}
