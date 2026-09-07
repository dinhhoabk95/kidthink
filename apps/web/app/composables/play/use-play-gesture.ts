import {
  type GameEngine,
  type GameSession,
  type Gesture,
  toLogicPoint,
  type ViewEntity,
} from "@mindkid/game-engine";
import { type Ref, ref } from "vue";

export interface GestureOptions {
  readonly getEngine: () => GameEngine | null;
  readonly canvasRef: Ref<HTMLCanvasElement | null>;
  readonly onRoundWon: () => void;
}

export function usePlayGesture(options: GestureOptions) {
  const { getEngine, canvasRef, onRoundWon } = options;

  const viewEntities = ref<readonly ViewEntity[]>([]);

  let activePointerId: number | null = null;
  let startClientX = 0;
  let startClientY = 0;
  let startLogicX = 0;
  let startLogicY = 0;
  let pointerDownTime = 0;
  let isDragging = false;

  function syncView(): void {
    const engine = getEngine();
    const session = engine?.activeSession as
      | (GameSession & { getView?: () => { entities: readonly ViewEntity[] } })
      | null;
    if (session?.getView) {
      viewEntities.value = session.getView().entities ?? [];
    } else {
      viewEntities.value = [];
    }
  }

  function getCanvasRect(): DOMRect | null {
    return canvasRef.value?.getBoundingClientRect() ?? null;
  }

  function getLogicPoint(e: PointerEvent): { x: number; y: number } {
    const rect = getCanvasRect();
    if (!rect) {
      return { x: e.clientX, y: e.clientY };
    }
    const engine = getEngine();
    const lw = engine?.renderSystem?.LOGIC_WIDTH ?? 960;
    const lh = engine?.renderSystem?.LOGIC_HEIGHT ?? 540;
    return toLogicPoint(
      { x: e.clientX, y: e.clientY },
      {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
      lw,
      lh
    );
  }

  function dispatchGesture(gesture: Gesture): void {
    const engine = getEngine();
    const session = engine?.activeSession as
      | (GameSession & {
          dispatch?: (
            g: Gesture
          ) => { valid: boolean; feedback?: string } | undefined;
        })
      | null;

    if (!session || typeof session.dispatch !== "function") {
      return;
    }

    const verdict = session.dispatch(gesture);

    if (verdict?.valid) {
      engine?.audio.playSnapSound();
      engine?.audio.playPopCelebrateSound();
      engine?.scaffolding?.onMatch();
      syncView();

      if (session.checkWinCondition()) {
        onRoundWon();
      }
    } else if (verdict && !verdict.valid) {
      engine?.audio.playSoftFeedbackSound();
      engine?.scaffolding?.onMiss();
      syncView();
    }
  }

  function handlePointerDown(e: PointerEvent): void {
    if (activePointerId !== null) {
      return;
    }
    activePointerId = e.pointerId;
    startClientX = e.clientX;
    startClientY = e.clientY;
    pointerDownTime = Date.now();
    isDragging = false;

    const pt = getLogicPoint(e);
    startLogicX = pt.x;
    startLogicY = pt.y;

    if (canvasRef.value) {
      canvasRef.value.setPointerCapture?.(e.pointerId);
    }
  }

  function handlePointerMove(e: PointerEvent): void {
    if (activePointerId !== e.pointerId) {
      return;
    }
    const dist = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);
    if (dist > 12) {
      isDragging = true;
    }
  }

  function handlePointerUp(e: PointerEvent): void {
    if (activePointerId !== e.pointerId) {
      return;
    }

    const endPt = getLogicPoint(e);
    const timeMs = Date.now();
    const elapsed = timeMs - pointerDownTime;
    const dist = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);

    if (!isDragging && dist <= 14 && elapsed < 500) {
      // Tap gesture
      dispatchGesture({
        type: "tap",
        x: startLogicX,
        y: startLogicY,
        timeMs,
      });
    } else if (isDragging || dist > 14) {
      // Drop gesture
      dispatchGesture({
        type: "drop",
        fromX: startLogicX,
        fromY: startLogicY,
        toX: endPt.x,
        toY: endPt.y,
        timeMs,
      });
    }

    activePointerId = null;
    isDragging = false;
  }

  function handlePointerCancel(e: PointerEvent): void {
    if (activePointerId === e.pointerId) {
      activePointerId = null;
      isDragging = false;
    }
  }

  function handleAccessibleEntityTap(entity: ViewEntity): void {
    dispatchGesture({
      type: "tap",
      x: entity.x,
      y: entity.y,
      timeMs: Date.now(),
    });
  }

  return {
    viewEntities,
    syncView,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleAccessibleEntityTap,
  };
}
