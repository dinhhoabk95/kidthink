import {
  type ActionResult,
  type ActiveGestureVisualState,
  type FeedbackPoint,
  FeedbackSystem,
  findHitEntity,
  type GameEngine,
  type GameSession,
  type Gesture,
  type GestureTransitionFlight,
  isPointInZone,
  type OverlayFeedbackKind,
  type StageZones,
  TemplateGameSession,
  toLogicPoint,
  type ViewEntity,
} from "@mindkid/game-engine";
import type { AgeBand } from "@mindkid/shared/client";
import { computed, type Ref, ref } from "vue";
import {
  acceptsPointerOver,
  actionButtonOf,
  adjustDeltaOf,
  buildDragFlight,
  buildTapFlight,
  dispatchSessionGesture,
  feedbackPointOf,
  findDropTargetsInEntities,
  HIDDEN_ACTION_BUTTON,
  playWoodClackHoverCue,
  playWoodPickupCue,
  speakEntityKeyword,
  speakSessionRetryVoice,
  WRONG_COOLDOWN_MS,
} from "~/composables/play/play-gesture-helpers";

/** Nút hành động ở `zones.action` cho bàn phím và trình đọc màn hình (`BR-PSZ-05`). */
export interface ActionButtonState {
  readonly visible: boolean;
  readonly enabled: boolean;
  readonly label: string;
}

interface TouchingAwareSession {
  setTouchingItem(itemId: string | null): void;
}

function acceptsTouchingItem(
  candidate: GameSession
): candidate is GameSession & TouchingAwareSession {
  if (!("setTouchingItem" in candidate)) {
    return false;
  }
  const fn = (candidate as Partial<TouchingAwareSession>).setTouchingItem;
  return typeof fn === "function" && fn.length <= 1;
}

/**
 * Ngưỡng (px CSS) để một cử động thành kéo thay vì chạm. Ngón tay trẻ 3 tuổi
 * rung nhiều nên rộng hơn trẻ lớn (Task #313 B9).
 */
export function dragSlopCssPx(band: AgeBand): number {
  if (band === "3-4") {
    return 28;
  }
  return band === "4-5" ? 20 : 14;
}

export interface GestureOptions {
  readonly getEngine: () => GameEngine | null;
  /** Band tuổi để chọn ngưỡng kéo (`dragSlopCssPx`); thiếu thì dùng 4-5. */
  readonly getAgeBand?: () => AgeBand;
  readonly canvasRef: Ref<HTMLCanvasElement | null>;
  readonly onRoundWon: () => void;
  /**
   * Gọi khi trẻ trả lời sai ở một vòng cấm thử lại (`allow_retry: false`).
   * Bề mặt đi thẳng vào `session.dispatch()`, không qua `RoundRunner
   * .handleAction`, nên luật đóng vòng phải được gọi lại từ đây.
   */
  readonly onRetryDisallowed?: () => void;
  /**
   * Mọi verdict khác `none` — shell ghi một lần thử (`answer_correct` /
   * `answer_incorrect`) trước khi vòng đóng, để server chấm điểm từ event.
   */
  readonly onVerdict?: (isCorrect: boolean) => void;
  /** Vùng của bàn chơi (`play-stage-zones.md`). */
  readonly getStageZones?: () => StageZones | null;
  /** Chạm vào loa trong vùng lời dẫn (`zones.promptSpeaker`) phát lại lời dẫn (`BR-PSZ-08`). */
  readonly onPromptSpeakerTap?: () => void;
  /**
   * Verdict đúng/sai tại điểm trẻ chạm hoặc thả — shell đẩy vào lớp phủ phản
   * hồi chung và đổi dáng mascot (`BR-FBK-05`, `BR-FBK-11`).
   */
  readonly onFeedback?: (
    kind: OverlayFeedbackKind,
    point: FeedbackPoint
  ) => void;
}

export function usePlayGesture(options: GestureOptions) {
  const { getEngine, canvasRef, onRoundWon, onRetryDisallowed, onVerdict } =
    options;

  const viewEntities = ref<readonly ViewEntity[]>([]);
  const actionButton = ref<ActionButtonState>(HIDDEN_ACTION_BUTTON);
  const stagedSourceEntity = ref<ViewEntity | null>(null);
  const stagedEntityId = computed(() => stagedSourceEntity.value?.id ?? null);

  let activePointerId: number | null = null;
  let cachedCanvasRect: DOMRect | null = null;
  let startClientX = 0;
  let startClientY = 0;
  let startLogicX = 0;
  let startLogicY = 0;
  let currentLogicX = 0;
  let currentLogicY = 0;
  let isDragging = false;
  let activeDragEntity: ViewEntity | null = null;
  let hoveredTargetEntity: ViewEntity | null = null;
  /** Lúc verdict sai gần nhất (ms epoch) — cửa sổ cooldown `WRONG_COOLDOWN_MS`. */
  let lastWrongAtMs = Number.NEGATIVE_INFINITY;
  /** Xoay vòng câu khích lệ xuyên suốt phiên chơi (không lặp liên tiếp). */
  const retryVoice = new FeedbackSystem();
  let trailPoints: { readonly x: number; readonly y: number }[] = [];
  let lastMazeCellId: string | null = null;
  let didLiveMazeStep = false;
  let lastVerdictValid = false;
  let activeFlight: GestureTransitionFlight | null = null;
  let touchingEntityId: string | null = null;

  function syncTouchingItem(nextId: string | null): void {
    touchingEntityId = nextId;
    const engine = getEngine();
    const active = engine?.activeSession;
    if (!(active && acceptsTouchingItem(active))) {
      return;
    }
    if (
      nextId !== null &&
      (!engine.acceptingInput || active.isAcceptingInput?.() === false)
    ) {
      return;
    }
    active.setTouchingItem(nextId);
  }

  function nowClockMs(): number {
    return typeof performance === "undefined" ? Date.now() : performance.now();
  }

  /**
   * Bề mặt hai bước (kéo-thả) nhận ra qua việc view có ô đích.
   * Ở đó, chọn nguồn Cấm — NEVER gửi kèm gesture `tap`: template kéo-thả chấm
   * tap là sai, nên `scaffolding.onMiss()` chạy và hint leo thang chỉ vì trẻ
   * dùng bàn phím. Template chạm-chọn (không có ô đích) thì tap CHÍNH là đáp án.
   */
  function isTwoStepSurface(): boolean {
    return viewEntities.value.some((entity) => entity.role === "target");
  }

  function syncView(): void {
    const engine = getEngine();
    const session = engine?.activeSession;
    if (session instanceof TemplateGameSession) {
      viewEntities.value = session.getView?.().entities ?? [];
      actionButton.value = actionButtonOf(session);
    } else {
      viewEntities.value = [];
      actionButton.value = HIDDEN_ACTION_BUTTON;
    }
    if (
      stagedSourceEntity.value &&
      !(
        isTwoStepSurface() &&
        viewEntities.value.some((e) => e.id === stagedSourceEntity.value?.id)
      )
    ) {
      stagedSourceEntity.value = null;
    }
  }

  function getCanvasRect(): DOMRect | null {
    return cachedCanvasRect ?? canvasRef.value?.getBoundingClientRect() ?? null;
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

  function emitFeedback(kind: OverlayFeedbackKind, gesture: Gesture): void {
    const point = feedbackPointOf(gesture);
    if (point) {
      options.onFeedback?.(kind, point);
    }
  }

  /** Lời mời sau cử chỉ không phải lần sai (GT-036 chốt khi dải chưa có luật). */
  function speakInvitation(engine: GameEngine, session: GameSession): void {
    const invitation =
      session instanceof TemplateGameSession
        ? session.takeSpokenInvitation()
        : null;
    if (invitation) {
      engine.audio.speakPrompt(invitation);
    }
  }

  function handleSilentVerdict(
    engine: GameEngine,
    session: GameSession,
    tapped: ViewEntity | null
  ): void {
    const wasSelected = tapped?.state === "selected";
    syncView();
    const isQuietUnselect =
      wasSelected &&
      tapped !== null &&
      viewEntities.value.find((e) => e.id === tapped.id)?.state === "idle";
    if (!isQuietUnselect) {
      speakEntityKeyword(engine, tapped);
    }
    speakInvitation(engine, session);
  }

  function handleVerdict(
    verdict: ActionResult,
    engine: GameEngine,
    session: GameSession,
    tapped: ViewEntity | null,
    gesture: Gesture
  ): void {
    if (verdict.feedback === "none") {
      handleSilentVerdict(engine, session, tapped);
      return;
    }

    const speaksRetry =
      !verdict.valid && Date.now() - lastWrongAtMs >= WRONG_COOLDOWN_MS;
    speakEntityKeyword(
      engine,
      tapped,
      speaksRetry
        ? () => speakSessionRetryVoice(engine, session, retryVoice)
        : undefined
    );

    onVerdict?.(verdict.valid);

    if (verdict.valid) {
      engine.audio.playSnapSound();
      engine.audio.playPopCelebrateSound();
      emitFeedback("success", gesture);
      if (typeof engine.resetScaffolding === "function") {
        engine.resetScaffolding();
      } else {
        engine.scaffolding?.onSuccess();
      }
      syncView();

      if (session.checkWinCondition()) {
        onRoundWon();
      }
      return;
    }

    engine.audio.playSoftFeedbackSound();
    emitFeedback("retry", gesture);
    const now = Date.now();
    if (now - lastWrongAtMs >= WRONG_COOLDOWN_MS) {
      engine.scaffolding?.onMiss();
    }
    lastWrongAtMs = now;
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

  function isActionTap(
    gesture: Gesture,
    session: TemplateGameSession
  ): boolean {
    if (gesture.type !== "tap" || !session.needsCommit) {
      return false;
    }
    const zones = options.getStageZones?.();
    return Boolean(zones && isPointInZone(gesture.x, gesture.y, zones.action));
  }

  function getActiveSession(engine: GameEngine): TemplateGameSession | null {
    if (!engine.acceptingInput) {
      return null;
    }
    const session = engine.activeSession;
    if (!(session instanceof TemplateGameSession)) {
      return null;
    }
    if (!session.isAcceptingInput()) {
      return null;
    }
    return session;
  }

  function handleActionTap(
    gesture: Gesture,
    engine: GameEngine,
    session: TemplateGameSession
  ): boolean {
    if (!isActionTap(gesture, session)) {
      return false;
    }
    if (session.canCommit?.() === false) {
      return true;
    }
    const verdict = session.dispatch({
      type: "commit",
      timeMs: gesture.timeMs,
    });
    if (verdict) {
      handleVerdict(verdict, engine, session, null, gesture);
    }
    return true;
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
    const session = getActiveSession(engine);
    if (!session || handleActionTap(gesture, engine, session)) {
      return;
    }

    const { verdict, tapped } = dispatchSessionGesture(
      session,
      gesture,
      viewEntities.value
    );
    lastVerdictValid = Boolean(verdict?.valid);
    if (verdict) {
      handleVerdict(verdict, engine, session, tapped, gesture);
    }
  }

  function findDropTargetsFor(
    dragged: ViewEntity | null
  ): readonly ViewEntity[] {
    return findDropTargetsInEntities(viewEntities.value, dragged);
  }

  function stepLiveMazeCellIfLegal(pt: { x: number; y: number }): void {
    const engine = getEngine();
    if (!engine) {
      return;
    }
    const session = getActiveSession(engine);
    if (!session) {
      return;
    }
    if (session instanceof TemplateGameSession && session.needsTray) {
      return;
    }
    const hitCell = findHitEntity(viewEntities.value, pt.x, pt.y);
    if (!(hitCell?.id.startsWith("cell_") && hitCell.id !== lastMazeCellId)) {
      return;
    }
    const tapGesture: Gesture = {
      type: "tap",
      x: hitCell.x,
      y: hitCell.y,
      timeMs: Date.now(),
    };
    const action = session.toAction?.(tapGesture);
    if (!(action && session.validateAction(action).valid)) {
      return;
    }
    lastMazeCellId = hitCell.id;
    didLiveMazeStep = true;
    dispatchGesture(tapGesture);
  }

  function currentSlop(): number {
    return dragSlopCssPx(options.getAgeBand?.() ?? "4-5");
  }

  function appendTrailPoint(pt: { x: number; y: number }): void {
    const lastPt = trailPoints.at(-1);
    if (lastPt && Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) < 6) {
      return;
    }
    if (trailPoints.length >= 48) {
      trailPoints = [...trailPoints.slice(1), { x: pt.x, y: pt.y }];
    } else {
      trailPoints.push({ x: pt.x, y: pt.y });
    }
  }

  function handlePointerDown(e: PointerEvent): void {
    if (activePointerId !== null) {
      return;
    }
    activePointerId = e.pointerId;
    cachedCanvasRect = canvasRef.value?.getBoundingClientRect() ?? null;
    startClientX = e.clientX;
    startClientY = e.clientY;
    isDragging = false;

    const pt = getLogicPoint(e);
    startLogicX = pt.x;
    startLogicY = pt.y;
    currentLogicX = pt.x;
    currentLogicY = pt.y;
    activeDragEntity = findHitEntity(viewEntities.value, pt.x, pt.y);
    syncTouchingItem(activeDragEntity?.id ?? null);
    hoveredTargetEntity = null;
    if (
      activeDragEntity?.role === "source" &&
      activeDragEntity.state !== "correct"
    ) {
      playWoodPickupCue(getEngine());
    }
    trailPoints = [{ x: pt.x, y: pt.y }];
    lastMazeCellId = activeDragEntity?.id.startsWith("cell_")
      ? activeDragEntity.id
      : null;
    didLiveMazeStep = false;

    if (canvasRef.value) {
      canvasRef.value.setPointerCapture?.(e.pointerId);
    }
  }

  function updateDragHoverFeedback(pt: { x: number; y: number }): void {
    const candidates = findDropTargetsFor(activeDragEntity);
    const prevHoveredId = hoveredTargetEntity?.id ?? null;
    hoveredTargetEntity = findHitEntity(candidates, pt.x, pt.y);
    if (hoveredTargetEntity && hoveredTargetEntity.id !== prevHoveredId) {
      playWoodClackHoverCue(getEngine());
    }

    if (viewEntities.value.some((ent) => ent.id.startsWith("cell_"))) {
      stepLiveMazeCellIfLegal(pt);
    }

    const session = getEngine()?.activeSession;
    if (session && acceptsPointerOver(session)) {
      session.setPointerOver(pt.x, pt.y);
    }
    if (session instanceof TemplateGameSession) {
      session.onPointerMove(pt, { x: startLogicX, y: startLogicY });
    }
  }

  function handlePointerMove(e: PointerEvent): void {
    if (activePointerId !== e.pointerId) {
      return;
    }
    const pt = getLogicPoint(e);
    currentLogicX = pt.x;
    currentLogicY = pt.y;
    if (
      touchingEntityId !== null &&
      findHitEntity(viewEntities.value, pt.x, pt.y)?.id !== touchingEntityId
    ) {
      syncTouchingItem(null);
    }
    const dist = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);
    if (dist > currentSlop()) {
      isDragging = true;
    }
    if (!isDragging) {
      return;
    }

    appendTrailPoint(pt);
    updateDragHoverFeedback(pt);
  }

  /** Nhả hoặc huỷ: báo session dọn phản hồi theo tay, sau khi gesture đã dispatch. */
  function releasePointerFeedback(): void {
    syncTouchingItem(null);
    const session = getEngine()?.activeSession;
    if (session instanceof TemplateGameSession) {
      session.onPointerRelease();
    }
  }

  function triggerPostReleaseFlight(
    wasTap: boolean,
    prevSelected: ViewEntity | null,
    dragged: ViewEntity | null,
    endPt: { x: number; y: number }
  ): void {
    const startMs = nowClockMs();
    const nextFlight = wasTap
      ? buildTapFlight(
          viewEntities.value,
          prevSelected,
          { x: startLogicX, y: startLogicY },
          lastVerdictValid,
          startMs
        )
      : buildDragFlight(
          dragged,
          hoveredTargetEntity,
          endPt,
          lastVerdictValid,
          startMs
        );
    if (nextFlight) {
      activeFlight = nextFlight;
    }
  }

  function resetPointerTracking(): void {
    activePointerId = null;
    cachedCanvasRect = null;
    isDragging = false;
    activeDragEntity = null;
    hoveredTargetEntity = null;
    trailPoints = [];
    lastMazeCellId = null;
    didLiveMazeStep = false;
  }

  /**
   * Nét kéo → một gesture mà session đọc được, theo thứ tự `stroke` (từ
   * `trailPoints`) → `drop` from→to → `adjust`; không ai đọc thì giữ `drop`.
   */
  function buildDragGesture(
    from: { x: number; y: number },
    to: { x: number; y: number },
    timeMs: number
  ): Gesture {
    const drop: Gesture = {
      type: "drop",
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      timeMs,
    };
    const engine = getEngine();
    const session = engine ? getActiveSession(engine) : null;
    if (!session?.toAction) {
      return drop;
    }
    if (trailPoints.length >= 2) {
      const stroke: Gesture = {
        type: "stroke",
        points: [...trailPoints, { x: to.x, y: to.y }],
        timeMs,
      };
      if (session.toAction(stroke)) {
        return stroke;
      }
    }
    if (session.toAction(drop)) {
      return drop;
    }
    const adjust: Gesture = {
      type: "adjust",
      delta: adjustDeltaOf(from, to),
      timeMs,
    };
    return session.toAction(adjust) ? adjust : drop;
  }

  function handlePointerUp(e: PointerEvent): void {
    if (activePointerId !== e.pointerId) {
      return;
    }

    const endPt = getLogicPoint(e);
    const timeMs = Date.now();
    const dist = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);
    const prevSelected =
      viewEntities.value.find(
        (ent) => ent.role === "source" && ent.state === "selected"
      ) ?? stagedSourceEntity.value;
    const dragged = activeDragEntity;
    lastVerdictValid = false;

    if (!isDragging && dist <= currentSlop()) {
      dispatchGesture({
        type: "tap",
        x: startLogicX,
        y: startLogicY,
        timeMs,
      });
      triggerPostReleaseFlight(true, prevSelected, dragged, endPt);
    } else if (!didLiveMazeStep && (isDragging || dist > currentSlop())) {
      dispatchGesture(
        buildDragGesture({ x: startLogicX, y: startLogicY }, endPt, timeMs)
      );
      triggerPostReleaseFlight(false, prevSelected, dragged, endPt);
    }

    releasePointerFeedback();
    resetPointerTracking();
  }

  function handlePointerCancel(e: PointerEvent): void {
    if (activePointerId === e.pointerId) {
      releasePointerFeedback();
      resetPointerTracking();
    }
  }

  function getGestureVisualState(nowMs: number): ActiveGestureVisualState {
    if (
      activeFlight &&
      nowMs - activeFlight.startMs >= activeFlight.durationMs
    ) {
      activeFlight = null;
    }
    const staged =
      viewEntities.value.find(
        (ent) => ent.role === "source" && ent.state === "selected"
      ) ?? stagedSourceEntity.value;
    const targetEntities = findDropTargetsFor(activeDragEntity ?? staged);

    return {
      activeEntity: activeDragEntity,
      stagedEntity: staged,
      targetEntities,
      hoveredTarget: hoveredTargetEntity,
      startX: startLogicX,
      startY: startLogicY,
      currentX: currentLogicX,
      currentY: currentLogicY,
      isPointerDown: activePointerId !== null,
      isDragging,
      trailPoints,
      flight: activeFlight,
    };
  }

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
      if (!twoStep) {
        stagedSourceEntity.value = null;
        dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
        return;
      }
      stagedSourceEntity.value = entity.id === staged.id ? null : entity;
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

    if (entity.role === "source" && twoStep) {
      stagedSourceEntity.value = entity;
      return;
    }

    dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
  }

  function pressActionButton(): void {
    const timeMs = Date.now();
    const zones = options.getStageZones?.();
    if (zones) {
      dispatchGesture({
        type: "tap",
        x: zones.action.x + zones.action.w / 2,
        y: zones.action.y + zones.action.h / 2,
        timeMs,
      });
      return;
    }
    dispatchGesture({ type: "commit", timeMs });
  }

  function destroy(): void {
    syncTouchingItem(null);
    resetPointerTracking();
    activeFlight = null;
  }

  return {
    viewEntities,
    actionButton,
    pressActionButton,
    stagedEntityId,
    syncView,
    dispatchGesture,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleAccessibleEntityTap,
    getGestureVisualState,
    destroy,
  };
}
