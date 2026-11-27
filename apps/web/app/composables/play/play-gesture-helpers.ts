import {
  type ActionResult,
  acceptsDragVerb,
  type CommitIcon,
  type FeedbackPoint,
  type FeedbackSystem,
  findHitEntity,
  type GameEngine,
  type GameSession,
  type Gesture,
  type GestureTransitionFlight,
  PLAY_VERBS,
  type PlayVerb,
  TemplateGameSession,
  type ViewEntity,
} from "@mindkid/game-engine";
import type { AgeBand } from "@mindkid/shared/client";

/** Session theo dõi vị trí ngón tay để bật trạng thái "đích đang nhận". */
export interface PointerAwareSession {
  setPointerOver(x: number, y: number): void;
}

export function acceptsPointerOver(
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
  stop: "Dừng chương trình",
  listen: "Nghe mẫu",
};

export const HIDDEN_ACTION_BUTTON: ActionButtonState = {
  visible: false,
  enabled: false,
  label: "",
};

/**
 * Hai tap sai dồn dập trong khoảng này của trẻ nhỏ chỉ tính một miss, để
 * không nhảy hint L1/L3 (Task #313 B6).
 */
export const WRONG_COOLDOWN_MS = 400;

/**
 * Chạm lại cùng một vật trong khoảng này không đọc lại tên (`BR-PNR-13`):
 * trẻ chạm dồn dập không làm giọng cô lặp chồng.
 */
export const ENTITY_NAME_REPEAT_MS = 1500;

/** Số logic px kéo tương ứng một bậc `adjust`. */
export const ADJUST_STEP_PX = 48;

/**
 * Ngưỡng (px CSS) để một cử động thành kéo thay vì chạm. Ngón tay trẻ 3 tuổi
 * rung nhiều nên rộng hơn trẻ lớn: 12px/14px cố định làm tap rung thành drop
 * rồi bị nuốt (Task #313 B9).
 */
export function dragSlopCssPx(band: AgeBand): number {
  if (band === "3-4") {
    return 28;
  }
  return band === "4-5" ? 20 : 14;
}

/**
 * Verb phiên đang nhận (`BR-EIC-08`). Phiên không khai (mock, phiên ngoài
 * template) coi như nhận đủ sáu verb — giữ hành vi cũ.
 */
export function sessionVerbs(
  session: GameSession | null | undefined
): readonly PlayVerb[] {
  if (
    session instanceof TemplateGameSession &&
    typeof session.acceptedVerbs === "function"
  ) {
    return session.acceptedVerbs();
  }
  return PLAY_VERBS;
}

/** Nét kéo có nghĩa với phiên này không — không thì shell coi mọi cử động là chạm. */
export function sessionAcceptsDrag(
  session: GameSession | null | undefined
): boolean {
  return acceptsDragVerb(sessionVerbs(session));
}

export function actionButtonOf(
  session: TemplateGameSession
): ActionButtonState {
  if (!session.needsCommit) {
    return HIDDEN_ACTION_BUTTON;
  }
  return {
    visible: true,
    enabled: session.canCommit?.() ?? true,
    label: ACTION_LABEL_BY_ICON[session.commitIcon ?? "check"],
  };
}

export function dispatchSessionGesture(
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

/** Điểm gắn phản hồi: chỗ chạm của `tap`/`commit`, chỗ thả của `drop`. */
export function feedbackPointOf(gesture: Gesture): FeedbackPoint | null {
  if (gesture.type === "drop") {
    return { x: gesture.toX, y: gesture.toY };
  }
  if (gesture.type === "tap") {
    return { x: gesture.x, y: gesture.y };
  }
  return null;
}

/**
 * Quy đổi một nét kéo thành `adjust`: mỗi `ADJUST_STEP_PX` kéo sang phải hoặc
 * lên là +1 bậc (trái / xuống là -1), tối thiểu một bậc (Task #313 Phase 0).
 */
export function adjustDeltaOf(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const dx = to.x - from.x;
  const dy = from.y - to.y;
  const signed = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
  const steps = Math.max(1, Math.round(Math.abs(signed) / ADJUST_STEP_PX));
  return signed >= 0 ? steps : -steps;
}

export function findDropTargetsInEntities(
  all: readonly ViewEntity[],
  dragged: ViewEntity | null
): readonly ViewEntity[] {
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

export function buildTapFlight(
  entities: readonly ViewEntity[],
  prevSelected: ViewEntity | null,
  tapPt: { x: number; y: number },
  wasValid: boolean,
  startMs: number
): GestureTransitionFlight | null {
  const hitTarget = findHitEntity(
    entities.filter((ent) => ent.role === "target"),
    tapPt.x,
    tapPt.y
  );
  if (!(wasValid && prevSelected && hitTarget)) {
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

export function buildDragFlight(
  dragged: ViewEntity | null,
  hoveredTarget: ViewEntity | null,
  endPt: { x: number; y: number },
  wasValid: boolean,
  startMs: number
): GestureTransitionFlight | null {
  if (!(dragged && (dragged.glyph || dragged.label))) {
    return null;
  }
  if (wasValid && hoveredTarget) {
    return {
      entity: dragged,
      fromX: endPt.x,
      fromY: endPt.y,
      toX: hoveredTarget.x,
      toY: hoveredTarget.y,
      startMs,
      durationMs: 160,
      kind: "snap_to_target",
    };
  }
  if (!wasValid && dragged.role === "source") {
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

/** Phát âm gõ gỗ nhấc vật an toàn kể cả khi test truyền mock `audio` rút gọn. */
export function playWoodPickupCue(engine: GameEngine | null): void {
  const audio = engine?.audio as Partial<GameEngine["audio"]> | undefined;
  if (!audio) {
    return;
  }
  if (typeof audio.playWoodPickup === "function") {
    audio.playWoodPickup();
  } else if (typeof audio.play === "function") {
    audio.play("wood_pickup");
  }
}

/** Phát âm gỗ hút nam châm khi lướt qua đích an toàn với mock `audio` rút gọn. */
export function playWoodClackHoverCue(engine: GameEngine | null): void {
  const audio = engine?.audio as Partial<GameEngine["audio"]> | undefined;
  if (!audio) {
    return;
  }
  if (typeof audio.playWoodClackSnap === "function") {
    audio.playWoodClackSnap();
  } else if (typeof audio.play === "function") {
    audio.play("wood_clack_snap");
  }
}

/**
 * Đọc lại tên vật vừa chạm (Task #274 S7b, Task #316): mp3 giọng cô băm từ
 * `spokenLabel` (`BR-PNR-05`) → mp3 riêng của asset nếu giọng cô thiếu file →
 * không có gì thì im.
 */
export function speakEntityKeyword(
  engine: GameEngine,
  entity: ViewEntity | null,
  onDone?: () => void
): void {
  const label = entity?.spokenLabel;
  const audioPath = entity?.spokenAudioPath;
  let done = false;
  const finish = () => {
    if (!done) {
      done = true;
      onDone?.();
    }
  };
  const playAssetAudio = (): void => {
    if (!audioPath) {
      finish();
      return;
    }
    let fellBack = false;
    engine.audio.playPromptAudio(
      audioPath,
      () => {
        if (!fellBack) {
          finish();
        }
      },
      () => {
        fellBack = true;
        finish();
      }
    );
  };
  if (!label) {
    playAssetAudio();
    return;
  }
  let teacherFailed = false;
  engine.audio.speakPrompt(
    label,
    () => {
      if (!teacherFailed) {
        finish();
      }
    },
    () => {
      teacherFailed = true;
      playAssetAudio();
    }
  );
}

/**
 * Lời nói khi chưa đúng (`BR-FBK-13`, `BR-PNR-12`): engine có pill Montessori
 * thì đọc lời của pill (lý do cụ thể); không thì một câu khích lệ xoay vòng.
 */
export function speakSessionRetryVoice(
  engine: GameEngine,
  session: GameSession,
  retryVoice: FeedbackSystem,
  onEnd?: () => void
): void {
  const pillLine =
    session instanceof TemplateGameSession ? session.takePillNarration() : null;
  if (pillLine) {
    engine.audio.speakPrompt(pillLine, onEnd);
    return;
  }
  engine.audio.speakEncouragement(
    retryVoice.getRetryEncouragementClip(),
    onEnd
  );
}
