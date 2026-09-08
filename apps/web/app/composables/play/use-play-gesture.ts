import {
  type GameEngine,
  type Gesture,
  TemplateGameSession,
  toLogicPoint,
  type ViewEntity,
} from "@mindkid/game-engine";
import { computed, type Ref, ref } from "vue";

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
    const session = engine?.activeSession;
    if (session instanceof TemplateGameSession) {
      viewEntities.value = session.getView?.().entities ?? [];
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
    const session = engine?.activeSession;

    if (!session) {
      console.warn(
        "[play-gesture] dispatchGesture called without active session"
      );
      return;
    }
    if (!(session instanceof TemplateGameSession)) {
      console.warn(
        "[play-gesture] session is not an instance of TemplateGameSession"
      );
      return;
    }

    const verdict = session.dispatch(gesture);

    if (verdict?.valid) {
      engine?.audio.playSnapSound();
      engine?.audio.playPopCelebrateSound();
      engine?.scaffolding?.onSuccess();
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
    pointerDownTime = e.timeStamp;
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
    const elapsed = e.timeStamp - pointerDownTime;
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

  const stagedSourceEntity = ref<ViewEntity | null>(null);
  const stagedEntityId = computed(() => stagedSourceEntity.value?.id ?? null);

  function handleAccessibleEntityTap(entity: ViewEntity): void {
    const timeMs = Date.now();
    const staged = stagedSourceEntity.value;

    if (staged) {
      if (entity.role === "target") {
        // Step 2: Drop onto target
        dispatchGesture({
          type: "drop",
          fromX: staged.x,
          fromY: staged.y,
          toX: entity.x,
          toY: entity.y,
          timeMs,
        });
        stagedSourceEntity.value = null;
        return;
      }

      if (entity.role === "source") {
        if (entity.id === staged.id) {
          // Deselect
          stagedSourceEntity.value = null;
          dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
          return;
        }
        // Switch staged source
        stagedSourceEntity.value = entity;
        dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
        return;
      }

      stagedSourceEntity.value = null;
      dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
      return;
    }

    // No staged source yet
    if (entity.role === "source") {
      stagedSourceEntity.value = entity;
    }
    dispatchGesture({
      type: "tap",
      x: entity.x,
      y: entity.y,
      timeMs,
    });
  }

  return {
    viewEntities,
    stagedEntityId,
    syncView,
    dispatchGesture,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleAccessibleEntityTap,
  };
}
