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

  /**
   * Bề mặt hai bước (kéo-thả) nhận ra qua việc view có ô đích.
   * Ở đó, chọn nguồn Cấm — NEVER gửi kèm gesture `tap`: template kéo-thả chấm
   * tap là sai, nên `scaffolding.onMiss()` chạy và hint leo thang chỉ vì trẻ
   * dùng bàn phím. Template chạm-chọn (không có ô đích) thì tap CHÍNH là đáp án.
   */
  function isTwoStepSurface(): boolean {
    return viewEntities.value.some((entity) => entity.role === "target");
  }

  /** Bước 2 của đường bàn phím: đã có nguồn đang chọn. */
  function handleTapWithStagedSource(
    staged: ViewEntity,
    entity: ViewEntity,
    twoStep: boolean,
    timeMs: number
  ): void {
    if (entity.role === "target") {
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
      // Bỏ chọn, hoặc đổi nguồn đang chọn.
      stagedSourceEntity.value = entity.id === staged.id ? null : entity;
      if (!twoStep) {
        dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
      }
      return;
    }

    stagedSourceEntity.value = null;
    dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
  }

  function handleAccessibleEntityTap(entity: ViewEntity): void {
    const timeMs = Date.now();
    const staged = stagedSourceEntity.value;
    const twoStep = isTwoStepSurface();

    if (staged) {
      handleTapWithStagedSource(staged, entity, twoStep, timeMs);
      return;
    }

    if (entity.role === "source") {
      stagedSourceEntity.value = entity;
      if (twoStep) {
        return;
      }
    }

    dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
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
