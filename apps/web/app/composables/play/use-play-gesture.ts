import {
  type ActionResult,
  findHitEntity,
  type GameEngine,
  type GameSession,
  type Gesture,
  isPointInZone,
  type StageZones,
  TemplateGameSession,
  toLogicPoint,
  type ViewEntity,
} from "@mindkid/game-engine";
import { computed, type Ref, ref } from "vue";

export interface GestureOptions {
  readonly getEngine: () => GameEngine | null;
  readonly canvasRef: Ref<HTMLCanvasElement | null>;
  readonly onRoundWon: () => void;
  /**
   * Gọi khi trẻ trả lời sai ở một vòng cấm thử lại (`allow_retry: false`).
   * Bề mặt đi thẳng vào `session.dispatch()`, không qua `RoundRunner
   * .handleAction`, nên luật đóng vòng phải được gọi lại từ đây.
   */
  readonly onRetryDisallowed?: () => void;
  /** Vùng của bàn chơi (`play-stage-zones.md`). */
  readonly getStageZones?: () => StageZones | null;
  /** Chạm vào loa trong vùng lời dẫn (`zones.promptSpeaker`) phát lại lời dẫn (`BR-PSZ-08`). */
  readonly onPromptSpeakerTap?: () => void;
}

/** Session theo dõi vị trí ngón tay để bật trạng thái "đích đang nhận". */
interface PointerAwareSession {
  setPointerOver(x: number, y: number): void;
}

function acceptsPointerOver(
  session: GameSession
): session is GameSession & PointerAwareSession {
  return (
    typeof (session as Partial<PointerAwareSession>).setPointerOver ===
    "function"
  );
}

export function usePlayGesture(options: GestureOptions) {
  const { getEngine, canvasRef, onRoundWon, onRetryDisallowed } = options;

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
    if (
      engine?.renderSystem?.viewport &&
      engine.renderSystem.viewport.scale > 0
    ) {
      return engine.renderSystem.toLogicPoint(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    }
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

  /**
   * Đọc lại tên vật vừa chạm theo thang bậc của `play-narration.md` §7:
   * mp3 của asset → TTS từ `spokenLabel` → không có tên thì im (Task #274 S7b).
   */
  function speakKeyword(engine: GameEngine, entity: ViewEntity | null): void {
    const label = entity?.spokenLabel;
    const audioPath = entity?.spokenAudioPath;
    if (audioPath) {
      engine.audio.playPromptAudio(audioPath, undefined, () => {
        if (label) {
          engine.audio.speakPrompt(label);
        }
      });
      return;
    }
    if (label) {
      engine.audio.speakPrompt(label);
    }
  }

  function handleVerdict(
    verdict: ActionResult,
    engine: GameEngine,
    session: GameSession,
    tapped: ViewEntity | null
  ): void {
    speakKeyword(engine, tapped);

    if (verdict.feedback === "none") {
      // Cử chỉ bị nuốt: ngoài mọi slot, trước khi cảnh dựng xong, hoặc vòng
      // đã thắng (`BR-ETS-02`). Cấm — NEVER tính là lần sai — không phát âm
      // mềm, không leo bậc trợ giúp. Tên vừa đọc ở trên (nếu có) là đường
      // "chạm lại minh hoạ để nghe lại từ khoá", không phải một lượt trả lời.
      return;
    }

    if (verdict.valid) {
      engine.audio.playSnapSound();
      engine.audio.playPopCelebrateSound();
      engine.scaffolding?.onSuccess();
      syncView();

      if (session.checkWinCondition()) {
        onRoundWon();
      }
      return;
    }

    engine.audio.playSoftFeedbackSound();
    engine.scaffolding?.onMiss();
    syncView();
    onRetryDisallowed?.();
  }

  function isSpeakerTap(gesture: Gesture): boolean {
    if (gesture.type !== "tap") {
      return false;
    }
    const zones = options.getStageZones?.();
    return Boolean(
      zones && isPointInZone(gesture.x, gesture.y, zones.promptSpeaker)
    );
  }

  function dispatchGesture(gesture: Gesture): void {
    if (isSpeakerTap(gesture)) {
      options.onPromptSpeakerTap?.();
      return;
    }

    const engine = getEngine();
    if (!engine) {
      return;
    }
    if (!engine.acceptingInput) {
      // Câu dẫn chưa đọc xong (`BR-PNR-11`) — nuốt cử chỉ hoàn toàn: không
      // gọi tới session, không tính điểm, không tính miss, không đọc nhãn.
      return;
    }
    const session = engine.activeSession;
    if (!(session instanceof TemplateGameSession)) {
      return;
    }
    if (!session.isAcceptingInput()) {
      // Session đang đọc câu hỏi của chính nó (GT-000 ở mức bước,
      // `BR-E000-12`) — nuốt trọn như cổng câu dẫn vòng, không đọc nhãn: đọc
      // nhãn là cắt ngang câu hỏi đang đọc.
      return;
    }

    // Cùng hình học chạm với `toAction()` của engine (Task #274 S1d).
    const tapped =
      gesture.type === "tap"
        ? findHitEntity(viewEntities.value, gesture.x, gesture.y)
        : null;

    const verdict = session.dispatch(gesture);
    if (verdict) {
      handleVerdict(verdict, engine, session, tapped);
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
    if (!isDragging) {
      return;
    }
    // Đích sáng lên khi vật đủ gần — trạng thái "đích đang nhận" của hợp đồng
    // vẽ. Không có đường này thì cờ hover trong session không ai bật.
    const session = getEngine()?.activeSession;
    if (session && acceptsPointerOver(session)) {
      const pt = getLogicPoint(e);
      session.setPointerOver(pt.x, pt.y);
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
