import {
  type ActionResult,
  type ActiveGestureVisualState,
  type CommitIcon,
  type FeedbackPoint,
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

/** Nút hành động ở `zones.action` cho bàn phím và trình đọc màn hình (`BR-PSZ-05`). */
export interface ActionButtonState {
  readonly visible: boolean;
  readonly enabled: boolean;
  readonly label: string;
}

const ACTION_LABEL_BY_ICON: Readonly<Record<CommitIcon, string>> = {
  check: "Xong",
  play: "Chạy chương trình",
  listen: "Nghe mẫu",
};

/** Số logic px kéo tương ứng một bậc `adjust`. */
const ADJUST_STEP_PX = 48;

const HIDDEN_ACTION_BUTTON: ActionButtonState = {
  visible: false,
  enabled: false,
  label: "",
};

function actionButtonOf(session: TemplateGameSession) {
  if (!session.needsCommit) {
    return HIDDEN_ACTION_BUTTON;
  }
  return {
    visible: true,
    enabled: session.canCommit?.() ?? true,
    label: ACTION_LABEL_BY_ICON[session.commitIcon ?? "check"],
  };
}

function dispatchSessionGesture(
  session: TemplateGameSession,
  gesture: Gesture,
  entities: readonly ViewEntity[]
): { verdict: ActionResult | null; tapped: ViewEntity | null } {
  const tapped =
    gesture.type === "tap"
      ? findHitEntity(entities, gesture.x, gesture.y)
      : null;
  const stepBefore = (session as { currentStepIndex?: number })
    .currentStepIndex;
  const verdict = session.dispatch(gesture);
  const stepAfter = (session as { currentStepIndex?: number }).currentStepIndex;
  const stepAdvanced = stepBefore !== undefined && stepAfter !== stepBefore;
  return {
    verdict: verdict ?? null,
    tapped: stepAdvanced ? null : tapped,
  };
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
  let trailPoints: { readonly x: number; readonly y: number }[] = [];
  let lastMazeCellId: string | null = null;
  let didLiveMazeStep = false;
  let lastVerdictValid = false;
  let activeFlight: GestureTransitionFlight | null = null;

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

  /** Điểm gắn phản hồi: chỗ chạm của `tap`/`commit`, chỗ thả của `drop`. */
  function feedbackPointOf(gesture: Gesture): FeedbackPoint | null {
    if (gesture.type === "drop") {
      return { x: gesture.toX, y: gesture.toY };
    }
    if (gesture.type === "tap") {
      return { x: gesture.x, y: gesture.y };
    }
    return null;
  }

  function emitFeedback(kind: OverlayFeedbackKind, gesture: Gesture): void {
    const point = feedbackPointOf(gesture);
    if (point) {
      options.onFeedback?.(kind, point);
    }
  }

  function handleVerdict(
    verdict: ActionResult,
    engine: GameEngine,
    session: GameSession,
    tapped: ViewEntity | null,
    gesture: Gesture
  ): void {
    speakKeyword(engine, tapped);

    if (verdict.feedback === "none") {
      // Cử chỉ bị nuốt: ngoài mọi slot, trước khi cảnh dựng xong, hoặc vòng
      // đã thắng (`BR-ETS-02`). Cấm — NEVER tính là lần sai — không phát âm
      // mềm, không leo bậc trợ giúp. Tên vừa đọc ở trên (nếu có) là đường
      // "chạm lại minh hoạ để nghe lại từ khoá", không phải một lượt trả lời.
      syncView();
      return;
    }

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
    const all = viewEntities.value;
    const targets = all.filter((e) => e.role === "target");
    if (targets.length > 0 && dragged?.role === "source") {
      return targets;
    }
    if (dragged?.role === "target") {
      return all.filter((e) => e.role === "source" && e.state !== "correct");
    }
    if (dragged) {
      return all.filter((e) => e.id !== dragged.id && e.state !== "correct");
    }
    return targets;
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
    hoveredTargetEntity = null;
    trailPoints = [{ x: pt.x, y: pt.y }];
    lastMazeCellId = activeDragEntity?.id.startsWith("cell_")
      ? activeDragEntity.id
      : null;
    didLiveMazeStep = false;

    if (canvasRef.value) {
      canvasRef.value.setPointerCapture?.(e.pointerId);
    }
  }

  function handlePointerMove(e: PointerEvent): void {
    if (activePointerId !== e.pointerId) {
      return;
    }
    const pt = getLogicPoint(e);
    currentLogicX = pt.x;
    currentLogicY = pt.y;
    const dist = Math.hypot(e.clientX - startClientX, e.clientY - startClientY);
    if (dist > 12) {
      isDragging = true;
    }
    if (!isDragging) {
      return;
    }

    appendTrailPoint(pt);
    const candidates = findDropTargetsFor(activeDragEntity);
    hoveredTargetEntity = findHitEntity(candidates, pt.x, pt.y);

    if (viewEntities.value.some((ent) => ent.id.startsWith("cell_"))) {
      stepLiveMazeCellIfLegal(pt);
    }

    // Đích sáng lên khi vật đủ gần — trạng thái "đích đang nhận" của hợp đồng
    // vẽ. Không có đường này thì cờ hover trong session không ai bật.
    const session = getEngine()?.activeSession;
    if (session && acceptsPointerOver(session)) {
      session.setPointerOver(pt.x, pt.y);
    }
  }

  function buildTapReleaseFlight(
    prevSelected: ViewEntity | null,
    startMs: number
  ): GestureTransitionFlight | null {
    const hitTarget = findHitEntity(
      viewEntities.value.filter((ent) => ent.role === "target"),
      startLogicX,
      startLogicY
    );
    if (!(lastVerdictValid && prevSelected && hitTarget)) {
      return null;
    }
    return {
      entity: prevSelected,
      fromX: prevSelected.x,
      fromY: prevSelected.y,
      toX: hitTarget.x,
      toY: hitTarget.y,
      startMs,
      durationMs: 200,
      kind: "snap_to_target",
    };
  }

  function buildDragReleaseFlight(
    dragged: ViewEntity | null,
    endPt: { x: number; y: number },
    startMs: number
  ): GestureTransitionFlight | null {
    if (!(dragged && (dragged.glyph || dragged.label))) {
      return null;
    }
    if (lastVerdictValid && hoveredTargetEntity) {
      return {
        entity: dragged,
        fromX: endPt.x,
        fromY: endPt.y,
        toX: hoveredTargetEntity.x,
        toY: hoveredTargetEntity.y,
        startMs,
        durationMs: 160,
        kind: "snap_to_target",
      };
    }
    if (!lastVerdictValid && dragged.role === "source") {
      return {
        entity: dragged,
        fromX: endPt.x,
        fromY: endPt.y,
        toX: dragged.x,
        toY: dragged.y,
        startMs,
        durationMs: 240,
        kind: "spring_back",
      };
    }
    return null;
  }

  function triggerPostReleaseFlight(
    wasTap: boolean,
    prevSelected: ViewEntity | null,
    dragged: ViewEntity | null,
    endPt: { x: number; y: number }
  ): void {
    const startMs = nowClockMs();
    const nextFlight = wasTap
      ? buildTapReleaseFlight(prevSelected, startMs)
      : buildDragReleaseFlight(dragged, endPt, startMs);
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
   * Quy đổi một nét kéo thành `adjust`: mỗi `ADJUST_STEP_PX` kéo sang phải hoặc
   * lên là +1 bậc (trái / xuống là -1), tối thiểu một bậc (Task #313 Phase 0).
   */
  function adjustDeltaOf(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): number {
    const dx = to.x - from.x;
    const dy = from.y - to.y;
    const signed = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    const steps = Math.max(1, Math.round(Math.abs(signed) / ADJUST_STEP_PX));
    return signed >= 0 ? steps : -steps;
  }

  /**
   * Nét kéo → một gesture mà session đọc được, theo thứ tự `stroke` (từ
   * `trailPoints`) → `drop` from→to → `adjust`; không ai đọc thì giữ `drop`.
   * `toAction` thuần với các gesture này nên thăm dò không đổi state.
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

    // Không đặt trần thời gian: trẻ 3 tuổi hay nhấn chậm, và một lần nhấn giữ
    // không di chuyển mà không thành tap lẫn drop là im lặng (`BR-FBK-02`).
    if (!isDragging && dist <= 14) {
      dispatchGesture({
        type: "tap",
        x: startLogicX,
        y: startLogicY,
        timeMs,
      });
      triggerPostReleaseFlight(true, prevSelected, dragged, endPt);
    } else if (!didLiveMazeStep && (isDragging || dist > 14)) {
      dispatchGesture(
        buildDragGesture({ x: startLogicX, y: startLogicY }, endPt, timeMs)
      );
      triggerPostReleaseFlight(false, prevSelected, dragged, endPt);
    }

    resetPointerTracking();
  }

  function handlePointerCancel(e: PointerEvent): void {
    if (activePointerId === e.pointerId) {
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
      if (!twoStep) {
        stagedSourceEntity.value = null;
        dispatchGesture({ type: "tap", x: entity.x, y: entity.y, timeMs });
        return;
      }
      // Bỏ chọn, hoặc đổi nguồn đang chọn.
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

  /**
   * Nút hành động bằng bàn phím (Tab + Enter/Space): cùng đường với chạm vào
   * `zones.action` — chạm giữa vùng để verdict, âm thanh và phản hồi đi chung một
   * lối (`BR-PSZ-05`). Chưa có vùng thì gửi thẳng `commit`.
   */
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
